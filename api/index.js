const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());

// เชื่อมต่อ Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint สำหรับทดสอบ
app.get('/api/test', async (req, res) => {
  res.json({ message: "Hello from Node.js API!" });
});

// บรรทัดนี้สำคัญมาก ห้ามใช้ serverless-http ซ้อนเด็ดขาด Vercel จัดการให้เอง
module.exports = app;