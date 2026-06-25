const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors'); // แนะนำให้เปิด CORS ไว้ด้วยครับ

// ดึงตัวแปรหรือ Route จากระบบเดิมของคุณ (เช็ค Path ให้ตรงกับโครงสร้างจริง)
// ตัวอย่างเช่น หากระบบเดิมของคุณถูกเขียนเอาไว้ในไฟล์ server.js หรือ server/app.js
const app = express(); 

app.use(cors());
app.use(express.json());

// เชื่อมต่อ Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// เขียนหรือย้าย Logic ของ /api/submissions/status มาไว้ที่นี่
app.get('/api/submissions/status', async (req, res) => {
  const { groupNumber } = req.query;
  
  try {
    // ตัวอย่างการดึงข้อมูลจาก Supabase โดยเช็คจาก groupNumber
    const { data, error } = await supabase
      .from('submissions') // เปลี่ยนเป็นชื่อ Table จริงของคุณใน Supabase
      .select('*')
      .eq('group_number', groupNumber); // เปลี่ยนเป็นชื่อ Column จริงของคุณ

    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;