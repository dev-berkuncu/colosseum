require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { kv } = require('@vercel/kv');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fallback user and pass
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'colosseum123';
const ADMIN_TOKEN = 'tok_' + Buffer.from(ADMIN_USER + ':' + ADMIN_PASS).toString('base64');

// Helper function to read DB
const readDB = async () => {
  try {
    const data = await kv.get('colosseum_data');
    if (data) {
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
  } catch (err) {
    console.error('Error reading database from KV:', err);
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

// Helper function to write DB
const writeDB = async (data) => {
  try {
    await kv.set('colosseum_data', data);
  } catch (err) {
    console.error('Error writing database to KV:', err);
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

// Get all data (for initial load)
app.get('/api/data', async (req, res) => {
  const data = await readDB();
  res.json(data);
});

// Projects
app.post('/api/projects', requireAuth, async (req, res) => {
  const db = await readDB();
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
  await writeDB(db);
  res.status(201).json(newProject);
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = parseInt(req.params.id);
  db.projects = db.projects.filter(p => p.id !== id);
  
  // Update videos that might have been linked to this project
  db.videos.forEach(v => {
    if (parseInt(v.projId) === id) {
      v.projId = '';
    }
  });

  await writeDB(db);
  res.sendStatus(204);
});

// Videos
app.post('/api/videos', requireAuth, async (req, res) => {
  const db = await readDB();
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
  
  await writeDB(db);
  res.status(201).json(newVideo);
});

app.delete('/api/videos/:id', requireAuth, async (req, res) => {
  const db = await readDB();
  const id = parseInt(req.params.id);
  
  const video = db.videos.find(v => v.id === id);
  if (video && video.projId) {
    const proj = db.projects.find(p => p.id == video.projId);
    if (proj && proj.video === video.url) {
      proj.video = ''; // Clear video reference from project
    }
  }

  db.videos = db.videos.filter(v => v.id !== id);
  await writeDB(db);
  res.sendStatus(204);
});

// Settings
app.post('/api/settings', requireAuth, async (req, res) => {
  const db = await readDB();
  const { title, sub, email, phone } = req.body;
  db.settings = { title, sub, email, phone };
  await writeDB(db);
  res.json(db.settings);
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
