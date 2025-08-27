// server.js
require('dotenv').config();
const express = require('express');
const webpush = require('web-push');
const path = require('path');

const app = express();
app.use(express.json());

// ให้เสิร์ฟไฟล์หน้าเว็บจากโฟลเดอร์ปัจจุบัน
app.use(express.static(path.join(__dirname)));

// ตั้งค่า VAPID
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if(!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY){
  console.warn('⚠️  Missing VAPID keys in .env - server.js:18');
}

webpush.setVapidDetails(
  'mailto:admin@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// เก็บ subscription ในหน่วยความจำ (ตัวอย่าง)
const subs = new Set();

app.post('/api/save-sub', (req, res) => {
  try{
    const sub = req.body;
    subs.add(JSON.stringify(sub));
    return res.json({ok:true});
  }catch(e){
    return res.status(400).json({ok:false, error:e.message});
  }
});

// ยิงทดสอบหา “ทุก subscription” ที่มีอยู่
app.post('/api/push-test', async (req, res) => {
  try{
    const payload = JSON.stringify({
      title: 'ทดสอบ MediSafe',
      body: 'นี่คือการแจ้งเตือนทดสอบจากเซิร์ฟเวอร์ (ควรเด้งบน Lock Screen)',
      url: '/', tag:'medisafe-test', renotify:true
    });

    const tasks = [...subs].map(s => {
      const sub = JSON.parse(s);
      return webpush.sendNotification(sub, payload).catch(err=>{
        // ถ้าส่งไม่สำเร็จ ลบ sub ที่ตายแล้ว
        if (err.statusCode === 404 || err.statusCode === 410) subs.delete(s);
      });
    });

    await Promise.all(tasks);
    return res.json({ok:true, sent: subs.size});
  }catch(e){
    return res.status(500).json({ok:false, error:e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('MediSafe server running on http://localhost: - server.js:66'+PORT);
});
