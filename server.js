require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fallback user and pass for Admin Panel
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'colosseum123';
const ADMIN_TOKEN = 'tok_' + Buffer.from(ADMIN_USER + ':' + ADMIN_PASS).toString('base64');

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'colosseum',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to initialize default settings if missing
const initSettings = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO settings (id, title, sub, email, phone) VALUES (1, ?, ?, ?, ?)',
        ['Colosseum', 'Belgesel · Kısa Film · Tanıtım', 'contact@colosseum.com', '888-888-88']
      );
    }
  } catch (err) {
    console.error('MySQL Settings Initialization Error:', err);
  }
};
initSettings();

// --- Auth Middleware ---
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader === `Bearer ${ADMIN_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: 'Yetkisiz işlem. Lütfen giriş yapın.' });
  }
};

// --- API Endpoints ---

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
  }
});

// Admin Page Route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Get all data (for initial load)
app.get('/api/data', async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT id, title, tag, description AS `desc`, video, color FROM projects ORDER BY id DESC');
    const [settingsRows] = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    res.json({
      projects,
      videos: [], // We merged videos into projects schema for simplicity
      settings: settingsRows[0] || {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Veritabanı bağlantı hatası.' });
  }
});

// Projects
app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { title, tag, desc, video, color } = req.body;
    const finalColor = parseInt(color) || 0;
    const finalTag = tag || 'Proje';
    const finalVideo = video || '';
    
    const [result] = await pool.query(
      'INSERT INTO projects (title, tag, description, video, color) VALUES (?, ?, ?, ?, ?)',
      [title, finalTag, desc, finalVideo, finalColor]
    );
    
    res.status(201).json({
      id: result.insertId,
      title,
      tag: finalTag,
      desc,
      video: finalVideo,
      color: finalColor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Veritabanına kaydedilemedi.' });
  }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Veritabanından silinemedi.' });
  }
});

// Settings
app.post('/api/settings', requireAuth, async (req, res) => {
  try {
    const { title, sub, email, phone } = req.body;
    await pool.query(
      'UPDATE settings SET title = ?, sub = ?, email = ?, phone = ? WHERE id = 1',
      [title, sub, email, phone]
    );
    res.json({ title, sub, email, phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ayarlar güncellenemedi.' });
  }
});

// Always listen for Hostinger/cPanel to proxy the application
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
