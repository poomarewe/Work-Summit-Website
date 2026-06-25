import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// เชื่อมต่อ Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint ตัวปัญหาหน้าเว็บเรียกหา
app.get('/api/submissions/status', async (req, res) => {
  const { groupNumber } = req.query;
  
  try {
    const { data, error } = await supabase
      .from('submissions') // ตรวจสอบชื่อ Table ใน Supabase ให้ตรงกันด้วยครับ
      .select('*')
      .eq('group_number', groupNumber);

    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// สำหรับทดสอบ API ระบบ
app.get('/api/test', (req, res) => {
  res.json({ message: "Hello from ES Module Node.js API!" });
});

export default app;