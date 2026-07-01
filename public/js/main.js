const defaultState = {
  projects: [],
  videos: [],
  settings: {
    title: 'Colosseum',
    sub: 'Belgesel · Kısa Film · Tanıtım',
    email: 'contact@colosseum.com',
    phone: '888-888-88'
  }
};

let state = JSON.parse(JSON.stringify(defaultState));

const COLORS = [
  'linear-gradient(135deg,#6F5637 0%,#D7B76A 100%)',
  'linear-gradient(135deg,#3D4A2B 0%,#A2A86A 100%)',
  'linear-gradient(135deg,#5E201F 0%,#B86943 100%)',
  'linear-gradient(135deg,#1F415A 0%,#91B6C8 100%)',
  'linear-gradient(135deg,#A96D2D 0%,#F0D08D 100%)',
];

async function loadData() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      state = data;
      applySettings();
      renderProjects();
    }
  } catch (err) {
    console.error('Veri yüklenemedi:', err);
  }
}

/* ─────────────── CANVAS HERO ─────────────── */
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let W, H;
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);

const dust = [];
for (let i = 0; i < 75; i++) {
  dust.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.7 + .35, a: Math.random() * Math.PI * 2, drift: (Math.random() - .5) * .0009, rise: Math.random() * .001 + .00025, alpha: Math.random() * .55 + .15 });
}

function drawColosseum(t) {
  const cx = W / 2, baseY = H * .79;
  const gnd = ctx.createLinearGradient(0, baseY - 20, 0, H);
  gnd.addColorStop(0, 'rgba(188,139,73,.18)');
  gnd.addColorStop(.45, 'rgba(111,73,42,.22)');
  gnd.addColorStop(1, 'rgba(65,40,25,.32)');
  ctx.fillStyle = gnd; ctx.fillRect(0, baseY - 20, W, H - baseY + 20);

  const cW = Math.min(W * .72, 760), cH = H * .43;
  const cX = cx - cW / 2, cY = baseY - cH;

  const glow = ctx.createRadialGradient(cx, cY + cH * .25, 20, cx, cY + cH * .25, cW * .72);
  glow.addColorStop(0, 'rgba(255,231,158,.18)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.fillRect(cx - cW * .75, cY - 80, cW * 1.5, cH + 140);

  const layers = [
    { floors: 9, yOff: 0, h: .35, shade: 0 },
    { floors: 9, yOff: .35, h: .33, shade: 1 },
    { floors: 9, yOff: .68, h: .32, shade: 2 },
  ];

  layers.forEach((layer, li) => {
    const ly = cY + cH * layer.yOff;
    const lh = cH * layer.h;
    const n = layer.floors;
    const archW = cW / n;
    for (let i = 0; i < n; i++) {
      const ax = cX + i * archW;
      const light = (i / n) * 18;
      const stone = ctx.createLinearGradient(ax, ly, ax + archW, ly + lh);
      stone.addColorStop(0, `rgba(${151 + light - li * 10},${119 + light - li * 6},${78 + light - li * 4},.94)`);
      stone.addColorStop(.5, `rgba(${188 + light - li * 12},${151 + light - li * 8},${94 + light - li * 6},.9)`);
      stone.addColorStop(1, `rgba(${102 + light - li * 10},${73 + light - li * 6},${47 + light - li * 4},.94)`);
      ctx.fillStyle = stone; ctx.fillRect(ax, ly, archW, lh);

      const archPad = archW * .15;
      const archInnerW = archW - archPad * 2;
      const archInnerH = lh * .56;
      const archX = ax + archPad;
      const archY = ly + lh * .12;
      const rx = archInnerW / 2;
      ctx.beginPath(); ctx.moveTo(archX, archY + archInnerH); ctx.lineTo(archX, archY + rx); ctx.arc(archX + rx, archY + rx, rx, Math.PI, 0); ctx.lineTo(archX + archInnerW, archY + archInnerH); ctx.closePath();
      ctx.fillStyle = `rgba(54,31,18,${.78 - li * .05})`; ctx.fill();
      ctx.strokeStyle = 'rgba(255,236,176,.18)'; ctx.lineWidth = .6; ctx.stroke();

      ctx.strokeStyle = 'rgba(70,44,24,.18)'; ctx.lineWidth = .7; ctx.strokeRect(ax, ly, archW, lh);
    }
  });

  ctx.fillStyle = 'rgba(118,80,44,.94)'; ctx.fillRect(cX - 8, cY - 16, cW + 16, 20);
  const toothN = Math.floor(cW / 23); const toothW = cW / toothN;
  for (let i = 0; i < toothN; i++) {
    if (i % 2 === 0) { ctx.fillStyle = 'rgba(93,61,35,.95)'; ctx.fillRect(cX + i * toothW, cY - 31, toothW * .82, 18); }
  }

  ctx.beginPath(); ctx.ellipse(cx, cY, cW * .52, 15, 0, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,231,158,.14)'; ctx.lineWidth = 1; ctx.stroke();
}

function drawCypress() {
  const tx = W * .76, ty = H * .78;
  const trunkH = H * .34;
  ctx.fillStyle = 'rgba(70,49,31,.82)';
  ctx.beginPath(); ctx.moveTo(tx - 9, ty); ctx.bezierCurveTo(tx - 8, ty - trunkH * .3, tx - 5, ty - trunkH * .7, tx - 2, ty - trunkH); ctx.lineTo(tx + 5, ty - trunkH); ctx.bezierCurveTo(tx + 7, ty - trunkH * .65, tx + 10, ty - trunkH * .28, tx + 12, ty); ctx.closePath(); ctx.fill();
  const crown = ctx.createLinearGradient(tx, ty - trunkH, tx, ty);
  crown.addColorStop(0, 'rgba(49,68,38,.94)'); crown.addColorStop(1, 'rgba(39,52,30,.9)');
  ctx.fillStyle = crown;
  ctx.beginPath(); ctx.ellipse(tx, ty - trunkH * .58, 40, 170, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(29,39,23,.42)'; ctx.beginPath(); ctx.ellipse(tx + 10, ty - trunkH * .54, 23, 138, 0, 0, Math.PI * 2); ctx.fill();
}

function drawDust() {
  dust.forEach(d => {
    d.y -= d.rise; d.x += Math.sin(d.a) * d.drift; d.a += .018;
    if (d.y < -0.05) { d.y = 1.04; d.x = Math.random(); }
    const alpha = (.45 + .55 * Math.sin(d.a)) * d.alpha;
    ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,222,150,${alpha})`; ctx.fill();
  });
}

function drawFog() {
  const fog = ctx.createLinearGradient(0, H * .55, 0, H * .86);
  fog.addColorStop(0, 'transparent'); fog.addColorStop(.55, 'rgba(255,230,179,.08)'); fog.addColorStop(1, 'rgba(255,246,216,.26)');
  ctx.fillStyle = fog; ctx.fillRect(0, H * .55, W, H * .31);
}
let animT = 0;
function animLoop() { ctx.clearRect(0, 0, W, H); animT += .008; drawColosseum(animT); drawCypress(animT); drawDust(); drawFog(); requestAnimationFrame(animLoop); }
animLoop();

/* ─────────────── YAPRAK ANİMASYONU ─────────────── */
let yapraklarBasladi = false;
function startYapraklar() {
  if (yapraklarBasladi) return; yapraklarBasladi = true;
  const container = document.getElementById('yaprak-container'); const count = 36;
  for (let i = 0; i < count; i++) {
    const y = document.createElement('div'); y.className = 'yaprak';
    const dur = (3.2 + Math.random() * 4.2).toFixed(1) + 's'; const delay = (Math.random() * 3).toFixed(1) + 's'; const sway = ((Math.random() - .5) * 210).toFixed(0) + 'px'; const size = (13 + Math.random() * 12).toFixed(0);
    y.style.cssText = `left:${(5 + Math.random() * 90).toFixed(1)}%;top:0;width:${size}px;height:${size * 1.3}px;--dur:${dur};--delay:${delay};--sway:${sway};filter:brightness(${.82 + Math.random() * .3});transform:rotate(${Math.random() * 360}deg);`;
    container.appendChild(y);
  }
}

/* ─────────────── SCROLL OBSERVER ─────────────── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); if (e.target.closest('#hakkimizda')) { startYapraklar(); } } });
}, { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

window.addEventListener('scroll', () => { document.getElementById('navbar').classList.toggle('scrolled', scrollY > 80); });

/* ─────────────── PROJELER ─────────────── */
function escapeHTML(str = '') {
  return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
}
function renderProjects() {
  const grid = document.getElementById('projectsGrid'); grid.innerHTML = '';
  state.projects.forEach(p => {
    let bgStyle = `background:${COLORS[p.color] || COLORS[0]}`;
    if (p.video && (p.video.includes('youtube') || p.video.includes('youtu.be'))) {
      const yid = youtubeId(p.video);
      bgStyle = `background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('https://img.youtube.com/vi/${yid}/maxresdefault.jpg') center/cover no-repeat`;
    }

    const card = document.createElement('div');
    card.className = 'project-card reveal' + (p.video ? ' has-video' : '');
    card.innerHTML = `
      <div class="project-card-bg" style="${bgStyle}"></div>
      <div class="project-card-overlay">
        <div class="project-tag">${escapeHTML(p.tag)}</div>
        <div class="project-title">${escapeHTML(p.title)}</div>
        <div class="project-desc">${escapeHTML(p.desc)}</div>
      </div>
      <div class="project-video-indicator ${p.video ? '' : 'hidden'}">▶</div>
    `;
    if (p.video) { card.addEventListener('click', () => openVideo(p.video)); }
    grid.appendChild(card); observer.observe(card);
  });
}

/* ─────────────── VİDEO MODAL ─────────────── */
function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.pop() || '';
  } catch (e) { return url.split('v=')[1] || url.split('/').pop(); }
}
function resetModal() {
  document.getElementById('videoModalInner').innerHTML = `<button class="video-modal-close" onclick="closeVideoModal()">✕ KAPAT</button><video id="modalVideo" controls></video>`;
}
window.openVideo = function (url) {
  const modal = document.getElementById('videoModal');
  if (url.includes('youtube') || url.includes('youtu.be')) {
    const id = youtubeId(url);
    document.getElementById('videoModalInner').innerHTML = `<button class="video-modal-close" onclick="closeVideoModal()">✕ KAPAT</button><iframe src="https://www.youtube.com/embed/${id}?autoplay=1" allowfullscreen></iframe>`;
  } else {
    resetModal();
    const vid = document.getElementById('modalVideo'); vid.src = url; vid.play().catch(() => { });
  }
  modal.classList.add('open');
}
window.closeVideoModal = function () {
  const modal = document.getElementById('videoModal'); modal.classList.remove('open');
  const vid = document.getElementById('modalVideo'); if (vid) { vid.pause(); vid.src = ''; }
  setTimeout(resetModal, 250);
}

function applySettings() {
  document.querySelector('.hero-title').textContent = state.settings.title;
  document.querySelector('.hero-sub').textContent = state.settings.sub;
  document.querySelector('.nav-logo').textContent = state.settings.title;
  document.querySelector('.footer-logo').textContent = state.settings.title;
  document.getElementById('contactEmail').textContent = state.settings.email;
  document.getElementById('contactPhone').textContent = state.settings.phone;
  document.title = state.settings.title + ' Film & Media';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeVideoModal(); } });

// Start the app by fetching data
loadData();
