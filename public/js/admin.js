// --- Token Management ---
let token = localStorage.getItem('col_admin_token');

// Auto check on load
if (token) {
  showDashboard();
} else {
  document.getElementById('login-section').style.display = 'block';
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
  
  projects.forEach(p => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div>
        <div class="item-title">${p.title || 'İsimsiz Proje'}</div>
        <div class="item-meta">${p.tag} • ${p.video ? 'Videolu' : 'Videsuz'}</div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="logout-btn" style="padding:6px 12px; font-size:0.8rem;" onclick='startEdit(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Düzenle</button>
        <button class="danger" onclick="deleteProject(${p.id})">Sil</button>
      </div>
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
function startEdit(p) {
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-title').value = p.title;
  document.getElementById('p-tag').value = p.tag;
  document.getElementById('p-video').value = p.video;
  document.getElementById('p-desc').value = p.desc;
  
  document.getElementById('btn-submit-project').textContent = 'Değişiklikleri Kaydet';
  document.getElementById('btn-submit-project').style.background = '#3b82f6';
  document.getElementById('btn-cancel-edit').style.display = 'block';
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  document.getElementById('p-id').value = '';
  document.getElementById('p-title').value = '';
  document.getElementById('p-tag').value = '';
  document.getElementById('p-video').value = '';
  document.getElementById('p-desc').value = '';
  
  document.getElementById('btn-submit-project').textContent = 'Projeyi Yayımla';
  document.getElementById('btn-submit-project').style.background = 'var(--gold)';
  document.getElementById('btn-cancel-edit').style.display = 'none';
}

async function saveProject(event) {
  const id = document.getElementById('p-id').value;
  const title = document.getElementById('p-title').value.trim();
  const tag = document.getElementById('p-tag').value.trim();
  const video = document.getElementById('p-video').value.trim();
  const desc = document.getElementById('p-desc').value.trim();
  
  if (!title) return alert('Lütfen proje başlığı girin');
  
  const btn = event ? event.target : document.querySelector('button');
  const oldText = btn.textContent;
  btn.textContent = 'İşleniyor...';
  
  try {
    const url = id ? `/api/projects/${id}` : '/api/projects';
    const method = id ? 'PUT' : 'POST';
    
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, tag, video, desc, color: Math.floor(Math.random()*5) })
    });
    
    if (res.ok) {
      cancelEdit();
      loadData();
    } else {
      const err = await res.json();
      alert('Hata: ' + (err.error || 'Bilinmeyen bir hata oluştu.'));
    }
  } catch (e) {
    alert('Bağlantı hatası: ' + e.message);
  } finally {
    if (btn) btn.textContent = id ? 'Değişiklikleri Kaydet' : 'Projeyi Yayımla';
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

async function saveSettings(event) {
  const title = document.getElementById('s-title').value.trim();
  const sub = document.getElementById('s-sub').value.trim();
  const email = document.getElementById('s-email').value.trim();
  const phone = document.getElementById('s-phone').value.trim();
  
  const btn = event ? event.target : document.querySelector('button');
  const oldText = btn.textContent;
  btn.textContent = 'Kaydediliyor...';
  
  try {
    const res = await authFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, sub, email, phone })
    });
    
    if (res.ok) {
      btn.textContent = 'Kaydedildi ✓';
      setTimeout(() => btn.textContent = oldText, 2000);
    }
  } catch (e) {
    alert(e.message);
    btn.textContent = oldText;
  }
}
