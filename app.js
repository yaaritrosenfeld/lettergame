/* ===== GLOBAL STATE ===== */
const state = {
  playerName: 'שחקן',
  shirtColor: '#e74c3c',
  pantsColor: '#2c3e50',
  hairStyle: 'short',
  bottomStyle: 'pants',
  photoDataUrl: null,
  coins: 0,
  lives: 3,
  currentWorld: 1,
  worldStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  usageStartTime: Date.now(),
  lastLifeBonus: Date.now(),
  activeGame: null,
  audioCtx: null,
};

// Hebrew letters for games
const HEBREW_LETTERS = [
  { letter: 'א', name: 'אלף', word: 'אמא' },
  { letter: 'ב', name: 'בית', word: 'בובה' },
  { letter: 'ג', name: 'גימל', word: 'גמל' },
  { letter: 'ד', name: 'דלת', word: 'דג' },
  { letter: 'ה', name: 'הה', word: 'הרים' },
  { letter: 'ו', name: 'וו', word: 'ורד' },
  { letter: 'ז', name: 'זיין', word: 'זברה' },
  { letter: 'ח', name: 'חית', word: 'חתול' },
  { letter: 'ט', name: 'טית', word: 'טלה' },
  { letter: 'י', name: 'יוד', word: 'ים' },
  { letter: 'כ', name: 'כף', word: 'כלב' },
  { letter: 'ל', name: 'למד', word: 'לימון' },
  { letter: 'מ', name: 'מם', word: 'מכונית' },
  { letter: 'נ', name: 'נון', word: 'נחש' },
  { letter: 'ס', name: 'סמך', word: 'סוס' },
];

const WORLD_DATA = {
  1: { icon: '🏔️', name: 'עולם אלף', letters: ['א', 'ב', 'ג'] },
  2: { icon: '🌊', name: 'עולם בית', letters: ['ד', 'ה', 'ו'] },
  3: { icon: '🌋', name: 'עולם גימל', letters: ['ז', 'ח', 'ט'] },
  4: { icon: '🏝️', name: 'עולם דלת', letters: ['י', 'כ', 'ל'] },
  5: { icon: '🏰', name: 'עולם הה', letters: ['מ', 'נ', 'ס'] },
};

/* ===== AUDIO ENGINE ===== */
function getAudioCtx() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return state.audioCtx;
}

function playTone(freq, duration = 0.2, type = 'square', gain = 0.3) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function playSuccess() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'sine', 0.4), i * 80));
}

function playFail() {
  [200, 150].forEach((f, i) => setTimeout(() => playTone(f, 0.3, 'sawtooth', 0.3), i * 150));
}

function playClick() { playTone(800, 0.08, 'sine', 0.2); }
function playCoin() {
  [900, 1100].forEach((f, i) => setTimeout(() => playTone(f, 0.1, 'sine', 0.2), i * 60));
}
function playCollision() { playTone(120, 0.4, 'sawtooth', 0.5); }

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'he-IL';
    utt.rate = 0.8;
    utt.pitch = 1.2;
    window.speechSynthesis.speak(utt);
  }
}

/* ===== SCREEN NAVIGATION ===== */
function goToScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  playClick();
}

/* ===== AVATAR BUILDER ===== */
function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    state.photoDataUrl = ev.target.result;
    renderFaceCanvas(ev.target.result);
  };
  reader.readAsDataURL(file);
}

function renderFaceCanvas(src) {
  const canvas = document.getElementById('face-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, 80, 80);
    // Clip to rounded rect
    ctx.save();
    roundedClip(ctx, 0, 0, 80, 80, 8);
    // Center crop
    const s = Math.min(img.width, img.height);
    const sx = (img.width - s) / 2;
    const sy = (img.height - s) / 2;
    ctx.drawImage(img, sx, sy, s, s, 0, 0, 80, 80);
    ctx.restore();
    // Cute overlay eyes if face detection not available
  };
  img.src = src;
}

function roundedClip(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.clip();
}

function updateName(val) {
  state.playerName = val || 'שחקן';
  const tag = document.getElementById('av-name-tag');
  if (tag) tag.textContent = val || '?';
}

function setHair(style, btn) {
  state.hairStyle = style;
  document.querySelectorAll('.opt-btn').forEach(b => { if (b.onclick && b.onclick.toString().includes('setHair')) b.classList.remove('active'); });
  btn.classList.add('active');
  const preview = document.getElementById('avatar-preview');
  if (style === 'long') preview.classList.add('hair-long');
  else preview.classList.remove('hair-long');
  const hair = document.getElementById('av-hair');
  if (hair) {
    hair.style.height = style === 'long' ? '24px' : '24px';
    hair.style.boxShadow = style === 'long' ? '-8px 30px 0 4px #5D4037' : 'none';
  }
  playClick();
}

function setShirtColor(color, btn) {
  state.shirtColor = color;
  btn.parentElement.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const body = document.getElementById('av-body');
  if (body) body.style.background = color;
  playClick();
}

function setPantsColor(color, btn) {
  state.pantsColor = color;
  btn.parentElement.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('av-leg-l').style.background = color;
  document.getElementById('av-leg-r').style.background = color;
  playClick();
}

function setBottom(style, btn) {
  state.bottomStyle = style;
  btn.parentElement.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const legs = document.getElementById('av-legs');
  if (style === 'skirt') {
    legs.classList.add('skirt-mode');
    // Draw skirt
    document.getElementById('av-leg-l').style.clipPath = 'polygon(0 0, 100% 0, 120% 100%, -20% 100%)';
    document.getElementById('av-leg-r').style.clipPath = 'polygon(0 0, 100% 0, 120% 100%, -20% 100%)';
    document.getElementById('av-leg-l').style.background = state.pantsColor;
    document.getElementById('av-leg-r').style.background = state.pantsColor;
  } else {
    legs.classList.remove('skirt-mode');
    document.getElementById('av-leg-l').style.clipPath = 'none';
    document.getElementById('av-leg-r').style.clipPath = 'none';
  }
  playClick();
}

function goToWorldMap() {
  if (!state.playerName || state.playerName === 'שחקן') {
    const n = document.getElementById('player-name').value.trim();
    if (n) state.playerName = n;
  }
  playSuccess();
  applyAvatarToMap();
  updateCoinDisplays();
  updateLivesDisplay();
  speakText('יאללה! בואו נתחיל את ההרפתקה!');
  goToScreen('screen-map');
  startLifeTimer();
}

function applyAvatarToMap() {
  // Update map character
  document.getElementById('mc-body').style.background = state.shirtColor;
  document.getElementById('mc-leg-l').style.background = state.pantsColor;
  document.getElementById('mc-leg-r').style.background = state.pantsColor;
  document.getElementById('mc-name').textContent = state.playerName;
  document.getElementById('bar-name').textContent = state.playerName;
  if (state.photoDataUrl) {
    document.getElementById('mc-head').style.background = 'transparent';
    document.getElementById('mc-head').textContent = '😊';
  }
}

/* ===== WORLD MAP ===== */
function enterWorld(worldId) {
  state.currentWorld = worldId;
  const world = WORLD_DATA[worldId];
  document.getElementById('popup-icon').textContent = world.icon;
  document.getElementById('popup-title').textContent = world.name;
  document.getElementById('world-popup').classList.remove('hidden');
  speakText('בחר משחק!');
  playClick();
}

function closeWorldPopup() {
  document.getElementById('world-popup').classList.add('hidden');
  playClick();
}

function startGame(type) {
  document.getElementById('world-popup').classList.add('hidden');
  state.activeGame = type;
  if (type === 'falling') {
    initFallingGame();
    goToScreen('screen-falling');
  } else {
    initLetterGame();
    goToScreen('screen-letters');
  }
}

/* ===== FALLING GAME ===== */
const FG = {
  canvas: null, ctx: null,
  gameActive: false,
  speed: 2, speedMultiplier: 1, level: 1,
  lives: 3, coins: 0,
  player: { x: 0, y: 0, w: 50, h: 70, vx: 0 },
  walls: [],
  obstacles: [],
  stars: [],
  lastWallTime: 0, lastObstTime: 0,
  score: 0, frameCount: 0,
  backgroundY: 0,
  trickAttempts: 0,
  currentTrickQuestion: null,
  animId: null,
  touchStartX: 0,
  gyroX: 0,
  playerCanvas: null,
};

function initFallingGame() {
  FG.canvas = document.getElementById('falling-canvas');
  FG.ctx = FG.canvas.getContext('2d');
  FG.canvas.width = window.innerWidth;
  FG.canvas.height = window.innerHeight - 60;

  FG.lives = state.lives;
  FG.coins = 0;
  FG.speed = 2;
  FG.speedMultiplier = 1;
  FG.level = 1;
  FG.walls = [];
  FG.obstacles = [];
  FG.stars = [];
  FG.score = 0;
  FG.frameCount = 0;
  FG.gameActive = true;

  FG.player.x = FG.canvas.width / 2 - 25;
  FG.player.y = 60;
  FG.player.vx = 0;

  updateFallUI();
  setupFallingControls();
  if (FG.animId) cancelAnimationFrame(FG.animId);
  fallingLoop();
}

function setupFallingControls() {
  const canvas = FG.canvas;

  // Touch
  canvas.ontouchstart = (e) => {
    e.preventDefault();
    FG.touchStartX = e.touches[0].clientX;
  };
  canvas.ontouchmove = (e) => {
    e.preventDefault();
    if (!FG.gameActive) return;
    const dx = e.touches[0].clientX - FG.touchStartX;
    FG.player.vx = dx * 0.15;
    FG.touchStartX = e.touches[0].clientX;
  };
  canvas.ontouchend = () => { FG.player.vx *= 0.5; };

  // Mouse
  canvas.onmousemove = (e) => {
    if (!FG.gameActive) return;
    const rect = canvas.getBoundingClientRect();
    FG.player.x = e.clientX - rect.left - FG.player.w / 2;
  };

  // Keyboard
  document.onkeydown = (e) => {
    if (!FG.gameActive) return;
    if (e.key === 'ArrowLeft') FG.player.vx = -6;
    if (e.key === 'ArrowRight') FG.player.vx = 6;
  };
  document.onkeyup = () => { FG.player.vx *= 0.3; };

  // Gyroscope
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma) FG.gyroX = e.gamma * 0.2;
    });
  }
}

function fallingLoop() {
  if (!FG.gameActive) return;
  FG.frameCount++;
  const ctx = FG.ctx;
  const W = FG.canvas.width, H = FG.canvas.height;

  // Update speed
  FG.speedMultiplier = 1 + FG.score * 0.001;
  const spd = FG.speed * FG.speedMultiplier;

  // Background scroll
  FG.backgroundY = (FG.backgroundY + spd) % 80;

  // Draw BG
  drawFallingBackground(ctx, W, H);

  // Spawn walls (corridor style)
  if (FG.frameCount % Math.max(30, 120 - FG.level * 10) === 0) {
    const gapW = Math.max(130, W * 0.45 - FG.level * 5);
    const gapX = 30 + Math.random() * (W - gapW - 60);
    FG.walls.push({ x: 0, y: -50, w: gapX, h: 45, color: pickWallColor() });
    FG.walls.push({ x: gapX + gapW, y: -50, w: W - gapX - gapW, h: 45, color: pickWallColor() });
  }

  // Spawn obstacles
  if (FG.frameCount % Math.max(60, 200 - FG.level * 15) === 0) {
    const obs = spawnObstacle(W, H);
    FG.obstacles.push(obs);
  }

  // Spawn collectible stars
  if (FG.frameCount % 90 === 0) {
    FG.stars.push({ x: 20 + Math.random() * (W - 40), y: -20, collected: false });
  }

  // Move & draw player
  FG.player.vx += FG.gyroX;
  FG.player.x += FG.player.vx;
  FG.player.vx *= 0.92;

  // Clamp player
  FG.player.x = Math.max(0, Math.min(W - FG.player.w, FG.player.x));

  // Update & draw walls
  let hit = false;
  FG.walls = FG.walls.filter(w => {
    w.y += spd;
    drawBlock(ctx, w.x, w.y, w.w, w.h, w.color);
    if (rectsOverlap(FG.player, w)) hit = true;
    return w.y < H + 50;
  });

  // Update & draw obstacles
  FG.obstacles = FG.obstacles.filter(o => {
    o.y += spd;
    if (o.oscillate) o.x = o.baseX + Math.sin(FG.frameCount * 0.05) * 60;
    drawObstacle(ctx, o);
    if (circleRectOverlap(o.x, o.y, o.r, FG.player)) hit = true;
    return o.y < H + 80;
  });

  // Stars
  FG.stars = FG.stars.filter(s => {
    s.y += spd;
    if (!s.collected) {
      drawStar(ctx, s.x, s.y);
      if (Math.hypot(FG.player.x + 25 - s.x, FG.player.y + 35 - s.y) < 35) {
        s.collected = true;
        FG.coins += 5;
        playCoin();
        showCoinPop(s.x, s.y, '+5');
        updateFallUI();
      }
    }
    return s.y < H + 30 && !s.collected;
  });

  // Draw player
  drawFallingPlayer(ctx, FG.player.x, FG.player.y, FG.player.w, FG.player.h);

  // HIT!
  if (hit) {
    FG.lives--;
    playCollision();
    flashScreen();
    FG.speed = Math.max(1.5, FG.speed * 0.8); // slow down on hit
    updateFallUI();
    if (FG.lives <= 0) {
      FG.gameActive = false;
      setTimeout(showTrickQuestion, 400);
    } else {
      // Brief invincibility - clear nearby walls
      FG.walls = FG.walls.filter(w => w.y < FG.player.y - 60);
    }
  }

  // Score
  FG.score++;
  if (FG.score % 300 === 0) {
    FG.level++;
    FG.speed += 0.4;
    showLevelUp(ctx, W, H);
  }

  FG.animId = requestAnimationFrame(fallingLoop);
}

function pickWallColor() {
  const colors = ['#e63946', '#457b9d', '#1d3557', '#2d6a4f', '#9b5de5', '#f77f00'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function spawnObstacle(W) {
  const types = [
    { emoji: '🪨', r: 25, color: '#888' },
    { emoji: '🌵', r: 22, color: '#2d6a4f' },
    { emoji: '💀', r: 24, color: '#555' },
    { emoji: '🔥', r: 22, color: '#f77f00' },
    { emoji: '⚡', r: 20, color: '#ffd166' },
  ];
  const t = types[Math.floor(Math.random() * types.length)];
  return {
    x: t.r + Math.random() * (W - t.r * 2),
    baseX: t.r + Math.random() * (W - t.r * 2),
    y: -50, r: t.r,
    emoji: t.emoji, color: t.color,
    oscillate: Math.random() > 0.5,
  };
}

function drawFallingBackground(ctx, W, H) {
  // Night sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0f0c29');
  grad.addColorStop(1, '#302b63');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Scrolling grid (Roblox style)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let y = -FG.backgroundY; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
}

function drawBlock(ctx, x, y, w, h, color) {
  if (w <= 0 || h <= 0) return;
  // 3D block effect
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x, y, w, 6);
  // Side shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + w - 5, y, 5, h);
  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x, y + h - 5, w, 5);
  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawObstacle(ctx, o) {
  ctx.font = `${o.r * 1.6}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Glow
  ctx.shadowColor = o.color;
  ctx.shadowBlur = 15;
  ctx.fillText(o.emoji, o.x, o.y);
  ctx.shadowBlur = 0;
}

function drawStar(ctx, x, y) {
  ctx.font = '28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 10;
  ctx.fillText('⭐', x, y);
  ctx.shadowBlur = 0;
}

function drawFallingPlayer(ctx, x, y, w, h) {
  // Roblox-style blocky character falling
  const skinColor = '#FDBCB4';
  const shirtColor = state.shirtColor;
  const pantsColor = state.pantsColor;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.ellipse(x + w/2, y + h + 4, w/2, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = pantsColor;
  roundRect(ctx, x + 4, y + h * 0.55, w * 0.38, h * 0.45, 4);
  roundRect(ctx, x + w * 0.58, y + h * 0.55, w * 0.38, h * 0.45, 4);

  // Body
  ctx.fillStyle = shirtColor;
  roundRect(ctx, x + 2, y + h * 0.28, w - 4, h * 0.3, 5);
  // Shirt detail
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, x + 2, y + h * 0.28, w - 4, 5, 3);

  // Arms (spread out for falling effect)
  ctx.fillStyle = shirtColor;
  roundRect(ctx, x - 12, y + h * 0.3, 12, h * 0.22, 4);
  roundRect(ctx, x + w, y + h * 0.3, 12, h * 0.22, 4);

  // Head
  ctx.fillStyle = skinColor;
  roundRect(ctx, x + 6, y, w - 12, h * 0.3, 6);

  if (state.photoDataUrl && FG.playerCanvas) {
    ctx.drawImage(FG.playerCanvas, x + 6, y, w - 12, h * 0.3);
  } else {
    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(x + w*0.35, y + h*0.12, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w*0.65, y + h*0.12, 4, 0, Math.PI*2); ctx.fill();
    // Smile (scared face)
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + w/2, y + h*0.2, 7, 0.2, Math.PI - 0.2); ctx.stroke();
  }

  // Hair
  ctx.fillStyle = '#5D4037';
  if (state.hairStyle === 'short') {
    roundRect(ctx, x + 6, y - 4, w - 12, 10, 4);
  } else {
    roundRect(ctx, x + 6, y - 4, w - 12, 10, 4);
    ctx.fillRect(x + 6, y, 8, h * 0.2);
    ctx.fillRect(x + w - 14, y, 8, h * 0.2);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
function circleRectOverlap(cx, cy, r, rect) {
  const nearX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return Math.hypot(cx - nearX, cy - nearY) < r * 0.75;
}

function flashScreen() {
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,0,0,0.4);z-index:999;pointer-events:none;';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 200);
}

function showLevelUp(ctx, W, H) {
  ctx.fillStyle = 'rgba(255,215,0,0.9)';
  ctx.font = 'bold 40px Fredoka One';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 10;
  ctx.fillText('רמה ' + FG.level + '! 🚀', W/2, H/2);
  ctx.shadowBlur = 0;
  speakText('רמה ' + FG.level + '!');
}

function updateFallUI() {
  document.getElementById('fall-coins').textContent = FG.coins;
  const icons = ['❤️', '❤️', '❤️'].map((h, i) => i < FG.lives ? '❤️' : '🖤').join('');
  document.getElementById('fall-lives-display').textContent = icons;
  document.getElementById('fall-speed').textContent = FG.speedMultiplier.toFixed(1);
}

/* ===== TRICK QUESTION ===== */
const TRICK_QUESTIONS = [
  { q: 'לחץ על האות: א', answer: 'א', choices: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'] },
  { q: 'לחץ על האות: ב', answer: 'ב', choices: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'] },
  { q: 'לחץ על האות: ג', answer: 'ג', choices: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'] },
  { q: 'לחץ על האות: ד', answer: 'ד', choices: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'] },
  { q: 'לחץ על האות: ה', answer: 'ה', choices: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'] },
];

let trickIdx = 0;
function showTrickQuestion() {
  trickIdx = Math.floor(Math.random() * TRICK_QUESTIONS.length);
  FG.currentTrickQuestion = TRICK_QUESTIONS[trickIdx];
  FG.trickAttempts = 0;

  const popup = document.getElementById('trick-popup');
  document.getElementById('trick-question-text').textContent = FG.currentTrickQuestion.q;
  document.getElementById('trick-feedback').textContent = '';
  document.getElementById('trick-attempts').textContent = 'נסיון 1 מתוך 2';

  // Build keyboard
  const kb = document.getElementById('trick-keyboard');
  kb.innerHTML = '';
  FG.currentTrickQuestion.choices.forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'trick-key';
    btn.textContent = letter;
    btn.onclick = () => checkTrickAnswer(letter, btn);
    kb.appendChild(btn);
  });

  popup.classList.remove('hidden');
  speakText(FG.currentTrickQuestion.q);
}

function playTrickAudio() {
  if (FG.currentTrickQuestion) {
    speakText(FG.currentTrickQuestion.q);
    playClick();
  }
}

function checkTrickAnswer(letter, btn) {
  const q = FG.currentTrickQuestion;
  if (!q) return;

  if (letter === q.answer) {
    btn.classList.add('correct');
    playSuccess();
    document.getElementById('trick-feedback').textContent = '🎉 כל הכבוד! קיבלת 3 חיים!';
    speakText('כל הכבוד!');
    setTimeout(() => {
      document.getElementById('trick-popup').classList.add('hidden');
      FG.lives = 3;
      FG.gameActive = true;
      updateFallUI();
      fallingLoop();
      addCoins(20);
    }, 1500);
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    FG.trickAttempts++;
    playFail();
    speakText('נסה שוב!');

    if (FG.trickAttempts >= 2) {
      document.getElementById('trick-feedback').textContent = '😊 בפעם הבאה תצליח! בואו ננסה שאלה אחרת';
      setTimeout(() => {
        // Switch question
        trickIdx = (trickIdx + 1) % TRICK_QUESTIONS.length;
        FG.currentTrickQuestion = TRICK_QUESTIONS[trickIdx];
        document.getElementById('trick-question-text').textContent = FG.currentTrickQuestion.q;
        document.getElementById('trick-feedback').textContent = '';
        FG.trickAttempts = 0;
        document.getElementById('trick-attempts').textContent = 'נסיון 1 מתוך 2';
        const kb = document.getElementById('trick-keyboard');
        kb.querySelectorAll('.trick-key').forEach(b => { b.classList.remove('wrong', 'correct'); b.disabled = false; });
        speakText(FG.currentTrickQuestion.q);
      }, 2000);
    } else {
      document.getElementById('trick-attempts').textContent = 'נסיון 2 מתוך 2';
      document.getElementById('trick-feedback').textContent = 'לא נכון, נסה שוב!';
    }
  }
}

/* ===== LETTER SELECTION GAME ===== */
const LG = {
  round: 0,
  totalRounds: 5,
  currentLetter: null,
  worldLetters: [],
  lives: 3,
  coins: 0,
  answered: false,
};

function initLetterGame() {
  LG.round = 0;
  LG.lives = state.lives;
  LG.coins = 0;
  LG.answered = false;
  const worldData = WORLD_DATA[state.currentWorld] || WORLD_DATA[1];
  LG.worldLetters = worldData.letters;

  // Apply avatar colors to letter game character
  document.getElementById('lc-body-el').style.background = state.shirtColor;
  document.getElementById('lc-leg-l').style.background = state.pantsColor;
  document.getElementById('lc-leg-r').style.background = state.pantsColor;

  document.getElementById('letter-feedback').style.display = 'none';
  nextLetterRound();
}

function nextLetterRound() {
  LG.round++;
  LG.answered = false;
  document.getElementById('letter-feedback').style.display = 'none';

  if (LG.round > LG.totalRounds) {
    endLetterGame();
    return;
  }

  // Pick a random letter from the world's letters, or all letters
  const allLetters = HEBREW_LETTERS.map(l => l.letter);
  const worldLettersExpanded = LG.worldLetters.length > 0 ? LG.worldLetters : allLetters;

  // Target letter
  const targetLetter = worldLettersExpanded[Math.floor(Math.random() * worldLettersExpanded.length)];
  LG.currentLetter = HEBREW_LETTERS.find(l => l.letter === targetLetter) || HEBREW_LETTERS[0];

  // Generate choices (3 wrong + 1 correct)
  const wrongLetters = HEBREW_LETTERS.filter(l => l.letter !== LG.currentLetter.letter)
    .sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...wrongLetters, LG.currentLetter].sort(() => Math.random() - 0.5);

  // Update UI
  document.getElementById('letter-prompt').textContent = `מצא את האות "${LG.currentLetter.letter}" (${LG.currentLetter.name})`;
  document.getElementById('speech-bubble').textContent = '?';
  document.getElementById('letter-round').textContent = LG.round;
  document.getElementById('letter-progress-fill').style.width = (LG.round / LG.totalRounds * 100) + '%';

  // Update lives
  const livesStr = Array.from({length: 3}, (_, i) => i < LG.lives ? '❤️' : '🖤').join('');
  document.getElementById('letter-lives-display').textContent = livesStr;
  document.getElementById('letter-coins').textContent = LG.coins;

  // Render choices
  const choicesEl = document.getElementById('letter-choices');
  choicesEl.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'letter-choice-btn';
    btn.innerHTML = `${choice.letter}<span class="choice-label">${choice.name}</span>`;
    btn.onclick = () => checkLetterAnswer(choice, btn);
    choicesEl.appendChild(btn);
  });

  // Auto-speak the question
  setTimeout(() => speakText('מצא את האות ' + LG.currentLetter.name), 300);
}

function playLetterAudio() {
  if (LG.currentLetter) {
    speakText('מצא את האות ' + LG.currentLetter.name + '. ' + LG.currentLetter.name + ' כמו ' + LG.currentLetter.word);
    playClick();
    // Animate character
    document.getElementById('speech-bubble').textContent = LG.currentLetter.letter;
    setTimeout(() => {
      if (!LG.answered) document.getElementById('speech-bubble').textContent = '?';
    }, 2000);
  }
}

function checkLetterAnswer(choice, btn) {
  if (LG.answered) return;

  if (choice.letter === LG.currentLetter.letter) {
    LG.answered = true;
    btn.classList.add('correct');
    playSuccess();
    LG.coins += 10;
    document.getElementById('speech-bubble').textContent = '✅';
    speakText('כל הכבוד! ' + choice.name + '!');

    const feedback = document.getElementById('letter-feedback');
    document.getElementById('feedback-icon').textContent = '🌟';
    document.getElementById('feedback-text').textContent = 'כל הכבוד! ' + choice.name + '!';
    feedback.style.display = 'flex';

    // Disable all buttons
    document.querySelectorAll('.letter-choice-btn').forEach(b => b.onclick = null);
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    playFail();
    LG.lives--;
    speakText('נסה שוב!');
    document.getElementById('letter-lives-display').textContent =
      Array.from({length: 3}, (_, i) => i < LG.lives ? '❤️' : '🖤').join('');

    if (LG.lives <= 0) {
      LG.answered = true;
      // Auto show correct answer
      document.querySelectorAll('.letter-choice-btn').forEach(b => {
        const letter = b.textContent[0];
        if (letter === LG.currentLetter.letter) b.classList.add('correct');
        b.onclick = null;
      });
      document.getElementById('feedback-icon').textContent = '💪';
      document.getElementById('feedback-text').textContent = 'האות הנכונה היא ' + LG.currentLetter.letter + ' - ' + LG.currentLetter.name;
      document.getElementById('letter-feedback').style.display = 'flex';
      speakText('האות הנכונה היא ' + LG.currentLetter.name);
    }
  }
}

function endLetterGame() {
  const earned = LG.coins;
  document.getElementById('win-coins-earned').textContent = earned;
  document.getElementById('wc-body').style.background = state.shirtColor;
  addCoins(earned);
  playSuccess();
  speakText('כל הכבוד! סיימת את המשחק!');
  goToScreen('screen-win');

  // Update world stars
  const stars = Math.min(3, Math.ceil(LG.coins / 10));
  state.worldStars[state.currentWorld] = Math.max(state.worldStars[state.currentWorld], stars);
  updateWorldStars();
}

function updateWorldStars() {
  for (let i = 1; i <= 5; i++) {
    const stars = state.worldStars[i];
    const el = document.getElementById('stars-' + i);
    if (el) {
      el.textContent = ['☆', '☆', '☆'].map((_, idx) => idx < stars ? '⭐' : '☆').join('');
    }
  }
}

/* ===== COINS & LIVES ===== */
function addCoins(amount) {
  state.coins += amount;
  updateCoinDisplays();
}

function updateCoinDisplays() {
  document.getElementById('coins-display').textContent = state.coins;
  document.getElementById('coins-map').textContent = state.coins;
}

function updateLivesDisplay() {
  const icons = Array.from({length: 3}, (_, i) => i < state.lives ? '❤️' : '🖤').join('');
  document.getElementById('lives-icons').textContent = icons;
}

function showCoinPop(x, y, text) {
  const el = document.createElement('div');
  el.className = 'coin-pop';
  el.textContent = text + ' 💎';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

/* ===== LIFE TIMER (every 5 min = +1 life) ===== */
function startLifeTimer() {
  setInterval(() => {
    const now = Date.now();
    if (now - state.lastLifeBonus >= 5 * 60 * 1000) {
      state.lastLifeBonus = now;
      if (state.lives < 6) {
        state.lives++;
        updateLivesDisplay();
        speakText('קיבלת חיים נוספים!');
        showCoinPop(window.innerWidth / 2, 100, '+❤️');
      }
    }
  }, 30000); // check every 30s
}

/* ===== EXIT GAME ===== */
function exitGame() {
  FG.gameActive = false;
  if (FG.animId) { cancelAnimationFrame(FG.animId); FG.animId = null; }
  // Add coins earned
  if (state.activeGame === 'falling') addCoins(FG.coins);
  playClick();
  goToScreen('screen-map');
}

/* ===== RESIZE ===== */
window.addEventListener('resize', () => {
  if (FG.canvas && document.getElementById('screen-falling').classList.contains('active')) {
    FG.canvas.width = window.innerWidth;
    FG.canvas.height = window.innerHeight - 60;
    FG.player.x = Math.min(FG.player.x, FG.canvas.width - FG.player.w);
  }
});

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Show promo screen
  speakText('ברוכים הבאים לעולם האותיות!');

  // Prevent default touch behaviors for canvas
  document.addEventListener('touchmove', (e) => {
    if (e.target.tagName === 'CANVAS') e.preventDefault();
  }, { passive: false });

  // Initialize color buttons - set first ones active properly
  const shirtBtns = document.querySelectorAll('.control-section:nth-child(4) .color-btn');
  if (shirtBtns.length) shirtBtns[0].classList.add('active');
  const pantsBtns = document.querySelectorAll('.control-section:nth-child(6) .color-btn');
  if (pantsBtns.length) pantsBtns[0].classList.add('active');
});
