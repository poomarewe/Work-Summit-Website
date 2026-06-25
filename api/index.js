import 'dotenv/config';
import serverless from 'serverless-http';
import app from '../server/app.js';

export default serverless(app);


const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());

// ดึงค่าจาก Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ตัวอย่างสร้าง API Endpoint สำหรับทดสอบ
app.get('/api/test', async (req, res) => {
    res.json({ message: "Hello from Node.js API!" });
});

module.exports = app;