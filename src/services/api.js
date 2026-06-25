async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }
  return payload;
}

export async function getSubmissionStatus(groupNumber, date) {
  const query = new URLSearchParams({ groupNumber: String(groupNumber) });
  if (date) {
    query.set('date', date);
  }
  const response = await request(`/api/submissions/status?${query.toString()}`);
  return response.submission ? { submitted: true, submission: response.submission } : { submitted: false, submission: null };
}

export async function submitSubmissionRequest({ groupNumber, file }) {
  if (!file) {
    throw new Error('Please select a PDF file.');
  }
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return request('/api/submissions', {
    method: 'POST',
    body: JSON.stringify({
      groupNumber,
      fileName: file.name,
      mimeType: file.type || 'application/pdf',
      fileContentBase64: btoa(binary),
      submittedAt: new Date().toISOString(),
    }),
  });
}

export async function cancelSubmissionRequest(id) {
  return request(`/api/submissions/${id}`, { method: 'DELETE' });
}

export async function getTodaySubmissions() {
  return request('/api/admin/today');
}

export async function getHistoryDates() {
  return request('/api/admin/history');
}

export async function getHistoryByDate(date) {
  return request(`/api/admin/history/${date}`);
}
