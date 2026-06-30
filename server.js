const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper function to read DB
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return { projects: [], videos: [], settings: {}, nextId: 1 };
  }
};

// Helper function to write DB
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing database:', err);
  }
};

// --- API Endpoints ---

// Get all data (for initial load)
app.get('/api/data', (req, res) => {
  const data = readDB();
  res.json(data);
});

// Projects
app.post('/api/projects', (req, res) => {
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
});

app.delete('/api/projects/:id', (req, res) => {
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
});

// Videos
app.post('/api/videos', (req, res) => {
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
});

app.delete('/api/videos/:id', (req, res) => {
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
});

// Settings
app.post('/api/settings', (req, res) => {
  const db = readDB();
  const { title, sub, email, phone, loc } = req.body;
  db.settings = { title, sub, email, phone, loc };
  writeDB(db);
  res.json(db.settings);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
