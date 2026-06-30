require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fallback user and pass
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'colosseum123';
const ADMIN_TOKEN = 'tok_' + Buffer.from(ADMIN_USER + ':' + ADMIN_PASS).toString('base64');

const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Helper function to read DB from local file
const readDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return { 
    projects: [], 
    videos: [], 
    settings: {
      title: 'Colosseum',
      sub: 'Belgesel · Kısa Film · Tanıtım',
      email: 'contact@colosseum.com',
      phone: '888-888-88'
    }, 
    nextId: 1 
  };
};

// Helper function to write DB to local file
const writeDB = (data) => {
  try {
    // Ensure data directory exists
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
    throw new Error('Dosyaya yazma işlemi başarısız oldu. Sunucu izinlerini kontrol edin.');
  }
};

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
app.get('/api/data', (req, res) => {
  const data = readDB();
  res.json(data);
});

// Projects
app.post('/api/projects', requireAuth, (req, res) => {
  try {
    const db = readDB();
    const { title, tag, desc, video, color } = req.body;
    const newProject = {
      id: db.nextId++,
      title,
      tag: tag || 'Proje',
      desc,
      video: video || '',
      color: parseInt(color) || 0
    };
    db.projects.push(newProject);
    writeDB(db);
    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  try {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.projects = db.projects.filter(p => p.id !== id);
    
    // Update videos that might have been linked to this project
    db.videos.forEach(v => {
      if (parseInt(v.projId) === id) {
        v.projId = '';
      }
    });

    writeDB(db);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Videos
app.post('/api/videos', requireAuth, (req, res) => {
  try {
    const db = readDB();
    const { title, url, desc, projId } = req.body;
    const newVideo = {
      id: db.nextId++,
      title,
      url,
      desc,
      projId
    };
    db.videos.push(newVideo);
    
    if (projId) {
      const proj = db.projects.find(p => p.id == projId);
      if (proj) proj.video = url;
    }
    
    writeDB(db);
    res.status(201).json(newVideo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/videos/:id', requireAuth, (req, res) => {
  try {
    const db = readDB();
    const id = parseInt(req.params.id);
    
    const video = db.videos.find(v => v.id === id);
    if (video && video.projId) {
      const proj = db.projects.find(p => p.id == video.projId);
      if (proj && proj.video === video.url) {
        proj.video = ''; // Clear video reference from project
      }
    }

    db.videos = db.videos.filter(v => v.id !== id);
    writeDB(db);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings
app.post('/api/settings', requireAuth, (req, res) => {
  try {
    const db = readDB();
    const { title, sub, email, phone } = req.body;
    db.settings = { title, sub, email, phone };
    writeDB(db);
    res.json(db.settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Always listen for Hostinger/cPanel to proxy the application
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
