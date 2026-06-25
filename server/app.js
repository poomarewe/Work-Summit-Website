import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const localStorageDir = join(projectRoot, 'server', 'data');
const localUploadsDir = join(localStorageDir, 'uploads');
const localIndexFile = join(localStorageDir, 'submissions.json');

function toDayString(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

function sanitizeFileName(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function isPdfMime(value) {
  return String(value).toLowerCase() === 'application/pdf';
}

function validateGroupNumber(groupNumber) {
  const parsed = Number(groupNumber);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 151) {
    throw new Error('Group number must be between 0 and 151.');
  }
  return parsed;
}

function toBase64Buffer(value) {
  const normalized = String(value || '').replace(/\s/g, '');
  if (!normalized) {
    throw new Error('The uploaded file is empty.');
  }
  const binary = Buffer.from(normalized, 'base64');
  if (!binary.length) {
    throw new Error('The uploaded file could not be decoded.');
  }
  return binary;
}

function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class LocalStorageAdapter {
  constructor(baseDir, indexFile) {
    this.baseDir = baseDir;
    this.indexFile = indexFile;
    this.records = [];
  }

  async init() {
    await mkdir(this.baseDir, { recursive: true });
    await mkdir(join(this.baseDir, 'uploads'), { recursive: true });
    try {
      const raw = await readFile(this.indexFile, 'utf8');
      const parsed = JSON.parse(raw);
      this.records = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.records = [];
      await writeFile(this.indexFile, '[]', 'utf8');
    }
  }

  async persist() {
    await writeFile(this.indexFile, JSON.stringify(this.records, null, 2), 'utf8');
  }

  async saveSubmission(payload) {
    const record = {
      id: payload.id,
      groupNumber: payload.groupNumber,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      storageKind: 'local',
      storagePath: payload.storagePath,
      submissionDate: payload.submissionDate,
      uploadedAt: payload.uploadedAt,
    };

    this.records = this.records.filter((current) => current.id !== record.id);
    this.records.push(record);
    await this.persist();
    return record;
  }

  async writeFileBuffer(record, buffer) {
    const directory = join(this.baseDir, 'uploads', record.submissionDate);
    await mkdir(directory, { recursive: true });
    const targetPath = join(directory, record.storagePath);
    await writeFile(targetPath, buffer);
    return targetPath;
  }

  async createSubmissionRecord({ groupNumber, fileName, mimeType, buffer, submittedAt }) {
    const submissionDate = toDayString(submittedAt);
    const extension = extname(fileName) || '.pdf';
    const storagePath = `${groupNumber}-${Date.now()}-${sanitizeFileName(fileName || 'submission')}${extension}`;
    const record = {
      id: buildId(),
      groupNumber,
      fileName,
      mimeType,
      storageKind: 'local',
      storagePath,
      submissionDate,
      uploadedAt: submittedAt,
    };

    await this.writeFileBuffer(record, buffer);
    await this.saveSubmission(record);
    return record;
  }

  async findByGroupAndDate(groupNumber, submissionDate) {
    return this.records.find((entry) => entry.groupNumber === groupNumber && entry.submissionDate === submissionDate) || null;
  }

  async getById(id) {
    return this.records.find((entry) => entry.id === id) || null;
  }

  async listByDate(submissionDate) {
    return this.records
      .filter((entry) => entry.submissionDate === submissionDate)
      .sort((left, right) => left.groupNumber - right.groupNumber);
  }

  async listDates() {
    return Array.from(new Set(this.records.map((entry) => entry.submissionDate).filter(Boolean))).sort().reverse();
  }

  async deleteById(id) {
    const record = await this.getById(id);
    if (!record) {
      return null;
    }
    const targetPath = join(this.baseDir, 'uploads', record.submissionDate, record.storagePath);
    try {
      await rm(targetPath, { force: true });
    } catch {
      // ignore missing file cleanup errors
    }
    this.records = this.records.filter((entry) => entry.id !== id);
    await this.persist();
    return record;
  }

  async getFileBuffer(record) {
    const targetPath = join(this.baseDir, 'uploads', record.submissionDate, record.storagePath);
    return readFile(targetPath);
  }

  async mergePdfs(records) {
    const targetPdf = await PDFDocument.create();
    for (const record of records) {
      const sourceBytes = await this.getFileBuffer(record);
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const pageIndices = sourcePdf.getPageIndices();
      const copiedPages = await targetPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => targetPdf.addPage(page));
    }
    return targetPdf.save();
  }
}

class SupabaseStorageAdapter {
  constructor(client) {
    this.client = client;
  }

  async saveSubmission(payload) {
    const { data, error } = await this.client
      .from('submissions')
      .insert({
        id: payload.id,
        group_number: payload.groupNumber,
        file_name: payload.fileName,
        mime_type: payload.mimeType,
        storage_kind: 'supabase',
        storage_path: payload.storagePath,
        submission_date: payload.submissionDate,
        uploaded_at: payload.uploadedAt,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message || 'Unable to save submission metadata.');
    }
    return data;
  }

  async uploadBuffer({ groupNumber, fileName, mimeType, buffer, submittedAt }) {
    const submissionDate = toDayString(submittedAt);
    const extension = extname(fileName) || '.pdf';
    const storagePath = `${submissionDate}/${groupNumber}-${Date.now()}-${sanitizeFileName(fileName || 'submission')}${extension}`;
    const { error: uploadError } = await this.client.storage.from('submissions').upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
      cacheControl: '3600',
    });

    if (uploadError) {
      throw new Error(uploadError.message || 'Upload failed.');
    }

    const record = {
      id: buildId(),
      groupNumber,
      fileName,
      mimeType,
      storageKind: 'supabase',
      storagePath,
      submissionDate,
      uploadedAt: submittedAt,
    };

    await this.saveSubmission(record);
    return record;
  }

  async findByGroupAndDate(groupNumber, submissionDate) {
    const { data, error } = await this.client
      .from('submissions')
      .select('*')
      .eq('group_number', groupNumber)
      .eq('submission_date', submissionDate)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Unable to check submission status.');
    }
    return data || null;
  }

  async getById(id) {
    const { data, error } = await this.client.from('submissions').select('*').eq('id', id).maybeSingle();
    if (error) {
      throw new Error(error.message || 'Unable to find submission.');
    }
    return data || null;
  }

  async listByDate(submissionDate) {
    const { data, error } = await this.client
      .from('submissions')
      .select('*')
      .eq('submission_date', submissionDate)
      .order('group_number', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Unable to load submissions.');
    }
    return data || [];
  }

  async listDates() {
    const { data, error } = await this.client.from('submissions').select('submission_date');
    if (error) {
      throw new Error(error.message || 'Unable to load history dates.');
    }
    return Array.from(new Set((data || []).map((entry) => entry.submission_date).filter(Boolean))).sort().reverse();
  }

  async deleteById(id) {
    const record = await this.getById(id);
    if (!record) {
      return null;
    }
    const { error: storageError } = await this.client.storage.from('submissions').remove([record.storage_path]);
    if (storageError) {
      throw new Error(storageError.message || 'Unable to remove uploaded file.');
    }
    const { error: deleteError } = await this.client.from('submissions').delete().eq('id', id);
    if (deleteError) {
      throw new Error(deleteError.message || 'Unable to delete submission.');
    }
    return record;
  }

  async getFileBuffer(record) {
    const { data, error } = await this.client.storage.from('submissions').download(record.storage_path);
    if (error) {
      throw new Error(error.message || 'Unable to load stored file.');
    }
    if (!data) {
      throw new Error('The requested file is missing.');
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async mergePdfs(records) {
    const targetPdf = await PDFDocument.create();
    for (const record of records) {
      const sourceBytes = await this.getFileBuffer(record);
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const copiedPages = await targetPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      copiedPages.forEach((page) => targetPdf.addPage(page));
    }
    return targetPdf.save();
  }
}

function createAdapter() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    return new SupabaseStorageAdapter(supabase);
  }
  return new LocalStorageAdapter(localStorageDir, localIndexFile);
}

const adapter = createAdapter();

async function initializeAdapter() {
  if (adapter instanceof LocalStorageAdapter) {
    await adapter.init();
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, mode: adapter instanceof LocalStorageAdapter ? 'local' : 'supabase' });
});

app.post('/api/submissions', async (req, res, next) => {
  try {
    await initializeAdapter();
    const groupNumber = validateGroupNumber(req.body?.groupNumber);
    const fileName = String(req.body?.fileName || 'submission.pdf');
    const mimeType = String(req.body?.mimeType || 'application/pdf');
    const submittedAt = req.body?.submittedAt || new Date().toISOString();
    const buffer = toBase64Buffer(req.body?.fileContentBase64);

    if (!isPdfMime(mimeType)) {
      return res.status(400).json({ error: 'Only PDF files are allowed.' });
    }

    const existing = await adapter.findByGroupAndDate(groupNumber, toDayString(submittedAt));
    if (existing) {
      return res.status(409).json({ error: 'This group number is already submitted for today.' });
    }

    const record = await (adapter instanceof LocalStorageAdapter
      ? adapter.createSubmissionRecord({ groupNumber, fileName, mimeType, buffer, submittedAt })
      : adapter.uploadBuffer({ groupNumber, fileName, mimeType, buffer, submittedAt }));

    return res.status(201).json({ ok: true, submission: record });
  } catch (error) {
    next(error);
  }
});

app.get('/api/submissions/status', async (req, res, next) => {
  try {
    await initializeAdapter();
    const groupNumber = validateGroupNumber(req.query.groupNumber);
    const submissionDate = String(req.query.date || toDayString());
    const submission = await adapter.findByGroupAndDate(groupNumber, submissionDate);
    res.json({ submitted: Boolean(submission), submission: submission || null });
  } catch (error) {
    next(error);
  }
});

app.get('/api/submissions/:id/file', async (req, res, next) => {
  try {
    await initializeAdapter();
    const record = await adapter.getById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    const buffer = await adapter.getFileBuffer(record);
    res.setHeader('Content-Type', record.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(record.fileName || 'submission.pdf')}"`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/submissions/:id', async (req, res, next) => {
  try {
    await initializeAdapter();
    const record = await adapter.getById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const today = toDayString();
    if (record.submissionDate !== today) {
      return res.status(409).json({ error: 'Only today\'s submissions can be cancelled.' });
    }

    await adapter.deleteById(req.params.id);
    return res.json({ ok: true, deleted: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/today', async (_req, res, next) => {
  try {
    await initializeAdapter();
    const submissions = await adapter.listByDate(toDayString());
    res.json({ submissions });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/history', async (_req, res, next) => {
  try {
    await initializeAdapter();
    const dates = await adapter.listDates();
    res.json({ dates });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/history/:date', async (req, res, next) => {
  try {
    await initializeAdapter();
    const submissions = await adapter.listByDate(req.params.date);
    res.json({ submissions });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/download/today', async (_req, res, next) => {
  try {
    await initializeAdapter();
    const submissions = await adapter.listByDate(toDayString());
    if (!submissions.length) {
      return res.status(404).json({ error: 'There are no submissions to merge today.' });
    }
    const mergedPdf = await adapter.mergePdfs(submissions);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="today-submissions.pdf"');
    return res.send(Buffer.from(mergedPdf));
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/download/:date', async (req, res, next) => {
  try {
    await initializeAdapter();
    const submissions = await adapter.listByDate(req.params.date);
    if (!submissions.length) {
      return res.status(404).json({ error: 'No submissions available for that date.' });
    }
    const mergedPdf = await adapter.mergePdfs(submissions);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="submissions-${req.params.date}.pdf"`);
    return res.send(Buffer.from(mergedPdf));
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message || 'An unexpected error occurred.' });
});

export default app;
