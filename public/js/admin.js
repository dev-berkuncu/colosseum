// --- Token Management ---
let token = localStorage.getItem('col_admin_token');

// Auto check on load
if (token) {
  showDashboard();
}

async function login() {
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  const err = document.getElementById('login-err');
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    
    if (res.ok) {
      const data = await res.json();
      token = data.token;
      localStorage.setItem('col_admin_token', token);
      err.textContent = '';
      showDashboard();
    } else {
      const data = await res.json();
      err.textContent = data.error || 'Giriş başarısız';
    }
  } catch (e) {
    err.textContent = 'Sunucuya bağlanılamadı';
  }
}

function logout() {
  token = null;
  localStorage.removeItem('col_admin_token');
  document.getElementById('dashboard-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

function showDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'block';
  loadData();
}

// --- Data Fetching ---
async function authFetch(url, options = {}) {
  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url, options);
  if (res.status === 401) {
    logout();
    throw new Error('Oturum süresi doldu');
  }
  return res;
}

async function loadData() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      renderProjects(data.projects);
      fillSettings(data.settings);
    }
  } catch (e) {
    console.error('Veri yüklenemedi', e);
  }
}

function renderProjects(projects) {
  const list = document.getElementById('projects-list');
  list.innerHTML = '';
  
  if (projects.length === 0) {
    list.innerHTML = '<p style="color:#71717a">Henüz eklenmiş proje yok.</p>';
    return;
  }
  
  projects.reverse().forEach(p => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div>
        <div class="item-title">${p.title || 'İsimsiz Proje'}</div>
        <div class="item-meta">${p.tag} • ${p.video ? 'Videolu' : 'Videsuz'}</div>
      </div>
      <button class="danger" onclick="deleteProject(${p.id})">Sil</button>
    `;
    list.appendChild(item);
  });
}

function fillSettings(settings) {
  document.getElementById('s-title').value = settings.title || '';
  document.getElementById('s-sub').value = settings.sub || '';
  document.getElementById('s-email').value = settings.email || '';
  document.getElementById('s-phone').value = settings.phone || '';
}

// --- Data Modification ---
async function addProject() {
  const title = document.getElementById('p-title').value.trim();
  const tag = document.getElementById('p-tag').value.trim();
  const video = document.getElementById('p-video').value.trim();
  const desc = document.getElementById('p-desc').value.trim();
  
  if (!title) return alert('Lütfen proje başlığı girin');
  
  const btn = event.target;
  btn.textContent = 'Ekleniyor...';
  
  try {
    const res = await authFetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, tag, video, desc, color: Math.floor(Math.random()*5) }) // Random background color for simplicity
    });
    
    if (res.ok) {
      document.getElementById('p-title').value = '';
      document.getElementById('p-tag').value = '';
      document.getElementById('p-video').value = '';
      document.getElementById('p-desc').value = '';
      loadData();
    }
  } catch (e) {
    alert(e.message);
  } finally {
    btn.textContent = 'Projeyi Ekle';
  }
}

async function deleteProject(id) {
  if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
  try {
    const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) loadData();
  } catch (e) {
    alert(e.message);
  }
}

async function saveSettings() {
  const title = document.getElementById('s-title').value.trim();
  const sub = document.getElementById('s-sub').value.trim();
  const email = document.getElementById('s-email').value.trim();
  const phone = document.getElementById('s-phone').value.trim();
  
  const btn = event.target;
  btn.textContent = 'Kaydediliyor...';
  
  try {
    const res = await authFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, sub, email, phone })
    });
    
    if (res.ok) {
      btn.textContent = 'Kaydedildi ✓';
      setTimeout(() => btn.textContent = 'Ayarları Kaydet', 2000);
    }
  } catch (e) {
    alert(e.message);
    btn.textContent = 'Ayarları Kaydet';
  }
}
