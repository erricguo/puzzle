const {
  Engine,
  Render,
  Runner,
  Bodies,
  Body,
  Composite,
  Events,
  Vector
} = Matter;

const VEGETABLES = [
  { name: '豌豆', imageSrc: 'assets/vegetables/01-pea.png', color: '#80bf43', radius: 18 },
  { name: '小蘿蔔', imageSrc: 'assets/vegetables/02-carrot.png', color: '#f08a33', radius: 22 },
  { name: '洋蔥', imageSrc: 'assets/vegetables/03-onion.png', color: '#d9a7d7', radius: 26 },
  { name: '番茄', imageSrc: 'assets/vegetables/04-tomato.png', color: '#f05b4f', radius: 31 },
  { name: '茄子', imageSrc: 'assets/vegetables/05-eggplant.png', color: '#8760a8', radius: 36 },
  { name: '甜椒', imageSrc: 'assets/vegetables/06-bell-pepper.png', color: '#49a757', radius: 41 },
  { name: '玉米', imageSrc: 'assets/vegetables/07-corn.png', color: '#f5ca45', radius: 47 },
  { name: '花椰菜', imageSrc: 'assets/vegetables/08-broccoli.png', color: '#4f9f55', radius: 53 },
  { name: '高麗菜', imageSrc: 'assets/vegetables/09-cabbage.png', color: '#93c56c', radius: 60 },
  { name: '南瓜', imageSrc: 'assets/vegetables/10-pumpkin.png', color: '#e58a2f', radius: 68 }
];

const vegetableImages = VEGETABLES.map((vegetable) => {
  const image = new Image();
  image.src = vegetable.imageSrc;
  return image;
});

const COMBO_BASE_DURATION = 500;
const COMBO_GROWTH = 1.05;
const COMBO_MAX_DURATION = 2000;
const COMBO_IMPACT_DURATION = 520;
const COMBO_SHAKE_DURATION = 280;
const COMBO_COLORS = ['#68d84d', '#ffd447', '#ff8c32', '#ff5bbd', '#8d70ff', '#35d7ff'];
const BACKGROUND_MUSIC_SRC = 'assets/sound/Juice%20Merge%20Parade.mp3';

const container = document.getElementById('canvas-container');
const scoreEl = document.getElementById('score');
const bestLevelEl = document.getElementById('bestLevel');
const nextLabelEl = document.getElementById('nextLabel');
const restartButton = document.getElementById('restartButton');
const pauseButton = document.getElementById('pauseButton');
const soundButton = document.getElementById('soundButton');
const volumeSlider = document.getElementById('volumeSlider');
const gameOverLeaderboardButton = document.getElementById('gameOverLeaderboardButton');
const playAgainButton = document.getElementById('playAgainButton');
const gameOverPanel = document.getElementById('gameOverPanel');
const pausePanel = document.getElementById('pausePanel');
const resumeButton = document.getElementById('resumeButton');
const finalScoreEl = document.getElementById('finalScore');
const finalComboEl = document.getElementById('finalCombo');
const startScene = document.getElementById('startScene');
const startButton = document.getElementById('startButton');
const startLeaderboardButton = document.getElementById('startLeaderboardButton');
const leaderboardScene = document.getElementById('leaderboardScene');
const closeLeaderboardButton = document.getElementById('closeLeaderboardButton');
const accountStatusEl = document.getElementById('accountStatus');
const googleSignInButton = document.getElementById('googleSignInButton');
const scoreTabButton = document.getElementById('scoreTabButton');
const comboTabButton = document.getElementById('comboTabButton');
const leaderboardListEl = document.getElementById('leaderboardList');
const leaderboardMessageEl = document.getElementById('leaderboardMessage');

const engine = Engine.create({
  gravity: { x: 0, y: 1.05 }
});
const world = engine.world;
const runner = Runner.create();

const state = {
  width: 0,
  height: 0,
  score: 0,
  scoreRemainder: 0,
  bestLevel: 1,
  nextLevel: 0,
  aiming: false,
  aimX: 0,
  pointerId: null,
  hasStarted: false,
  paused: false,
  gameOver: false,
  lastDropAt: 0,
  dangerY: 132,
  combo: 0,
  bestCombo: 0,
  comboDuration: 0,
  comboExpiresAt: 0,
  comboPulseStartedAt: 0,
  comboPulseColor: COMBO_COLORS[0],
  scoreSaved: false
};

const comboBursts = [];
const audioState = {
  context: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  musicElement: null,
  musicSource: null,
  enabled: localStorage.getItem('veggieMergeSoundEnabled') !== 'false',
  volume: Number(localStorage.getItem('veggieMergeVolume') || 0.7)
};
const leaderboardState = {
  activeTab: 'score',
  rows: {
    score: [],
    combo: []
  },
  localRows: loadLocalLeaderboard(),
  isConfigured: false,
  client: null,
  playerId: localStorage.getItem('veggieMergePlayerId') || createPlayerId(),
  playerName: localStorage.getItem('veggieMergePlayerName') || `玩家 ${Math.floor(Math.random() * 9000 + 1000)}`
};
localStorage.setItem('veggieMergePlayerId', leaderboardState.playerId);
localStorage.setItem('veggieMergePlayerName', leaderboardState.playerName);

const walls = {
  floor: null,
  left: null,
  right: null
};

const render = Render.create({
  element: container,
  engine,
  options: {
    width: 360,
    height: 640,
    background: 'transparent',
    wireframes: false,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2)
  }
});

function roundedRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function createPlayerId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadLocalLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem('veggieMergeLocalLeaderboard') || '[]');
  } catch {
    return [];
  }
}

function saveLocalLeaderboard() {
  const sorted = [...leaderboardState.localRows]
    .sort((a, b) => b.score - a.score || b.best_combo - a.best_combo || a.created_at.localeCompare(b.created_at))
    .slice(0, 50);
  leaderboardState.localRows = sorted;
  localStorage.setItem('veggieMergeLocalLeaderboard', JSON.stringify(sorted));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function setupSupabase() {
  const config = window.SUPABASE_CONFIG || {};
  const canCreateClient = Boolean(window.supabase?.createClient);
  leaderboardState.isConfigured = Boolean(config.url && config.anonKey && canCreateClient);

  if (!leaderboardState.isConfigured) {
    accountStatusEl.textContent = 'Supabase 尚未設定，排行榜暫用本機資料';
    googleSignInButton.hidden = true;
    return;
  }

  leaderboardState.client = window.supabase.createClient(config.url, config.anonKey);
  accountStatusEl.textContent = `訪客: ${leaderboardState.playerName}`;
  syncSupabaseUser();
}

async function syncSupabaseUser() {
  if (!leaderboardState.client) return;

  const { data } = await leaderboardState.client.auth.getUser();
  const user = data?.user;
  if (!user) {
    accountStatusEl.textContent = `訪客: ${leaderboardState.playerName}`;
    googleSignInButton.textContent = 'Google 登入';
    return;
  }

  leaderboardState.playerId = user.id;
  leaderboardState.playerName = user.user_metadata?.name || user.email || '登入玩家';
  accountStatusEl.textContent = leaderboardState.playerName;
  googleSignInButton.textContent = '已登入';
}

async function signInWithGoogle() {
  if (!leaderboardState.client) return;
  await leaderboardState.client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.href
    }
  });
}

async function submitLeaderboardScore() {
  if (state.scoreSaved || state.score <= 0) return;
  state.scoreSaved = true;

  const row = {
    player_id: leaderboardState.playerId,
    player_name: leaderboardState.playerName,
    score: state.score,
    best_combo: state.bestCombo,
    best_level: state.bestLevel,
    created_at: new Date().toISOString()
  };

  leaderboardState.localRows.push(row);
  saveLocalLeaderboard();

  if (!leaderboardState.client) return;

  const { error } = await leaderboardState.client
    .from('vegetable_merge_scores')
    .insert({
      player_id: row.player_id,
      player_name: row.player_name,
      score: row.score,
      best_combo: row.best_combo,
      best_level: row.best_level
    });

  if (error) {
    leaderboardMessageEl.textContent = `送出失敗，已保存在本機: ${error.message}`;
  }
}

async function loadLeaderboard() {
  const sortColumn = leaderboardState.activeTab === 'score' ? 'score' : 'best_combo';
  leaderboardMessageEl.textContent = '載入中...';

  if (!leaderboardState.client) {
    const rows = [...leaderboardState.localRows]
      .sort((a, b) => b[sortColumn] - a[sortColumn] || b.score - a.score)
      .slice(0, 10);
    leaderboardState.rows[leaderboardState.activeTab] = rows;
    renderLeaderboard();
    return;
  }

  const { data, error } = await leaderboardState.client
    .from('vegetable_merge_scores')
    .select('player_name, score, best_combo, best_level, created_at')
    .order(sortColumn, { ascending: false })
    .order('score', { ascending: false })
    .limit(10);

  if (error) {
    leaderboardMessageEl.textContent = `讀取失敗: ${error.message}`;
    leaderboardState.rows[leaderboardState.activeTab] = [];
    renderLeaderboard();
    return;
  }

  leaderboardState.rows[leaderboardState.activeTab] = data || [];
  renderLeaderboard();
}

function renderLeaderboard() {
  const rows = leaderboardState.rows[leaderboardState.activeTab];
  const metricKey = leaderboardState.activeTab === 'score' ? 'score' : 'best_combo';
  const metricLabel = leaderboardState.activeTab === 'score' ? '分' : 'COMBO';

  leaderboardListEl.replaceChildren();

  rows.forEach((row, index) => {
    const item = document.createElement('li');
    item.className = 'leaderboard-item';
    item.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="player">
        <strong>${escapeHtml(row.player_name || '匿名玩家')}</strong>
        <small>最高層 ${row.best_level || 1} · ${formatDate(row.created_at)}</small>
      </span>
      <span class="metric">${row[metricKey] || 0}<small>${metricLabel}</small></span>
    `;
    leaderboardListEl.appendChild(item);
  });

  leaderboardMessageEl.textContent = rows.length ? '' : '目前還沒有紀錄，先來打第一筆吧';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function openLeaderboard(tab = leaderboardState.activeTab) {
  if (state.hasStarted && !state.gameOver) {
    setPaused(true);
  }
  leaderboardState.activeTab = tab;
  scoreTabButton.classList.toggle('active', tab === 'score');
  comboTabButton.classList.toggle('active', tab === 'combo');
  leaderboardScene.hidden = false;
  loadLeaderboard();
}

function closeLeaderboard() {
  leaderboardScene.hidden = true;
}

function setupAudioUi() {
  volumeSlider.value = Math.round(audioState.volume * 100);
  soundButton.textContent = audioState.enabled ? '音效' : '靜音';
  soundButton.classList.toggle('muted', !audioState.enabled);
}

function ensureAudio() {
  if (audioState.context) {
    audioState.context.resume?.();
    ensureBackgroundMusic();
    return audioState.context;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext();
  audioState.context = context;
  audioState.master = context.createGain();
  audioState.musicGain = context.createGain();
  audioState.sfxGain = context.createGain();
  audioState.master.gain.value = audioState.enabled ? 1 : 0;
  audioState.musicGain.gain.value = audioState.volume;
  audioState.sfxGain.gain.value = 0.85;
  audioState.musicGain.connect(audioState.master);
  audioState.sfxGain.connect(audioState.master);
  audioState.master.connect(context.destination);
  ensureBackgroundMusic();
  return context;
}

function ensureBackgroundMusic() {
  if (!audioState.context || audioState.musicSource) return;

  const music = new Audio(BACKGROUND_MUSIC_SRC);
  music.loop = true;
  music.preload = 'auto';
  audioState.musicElement = music;
  audioState.musicSource = audioState.context.createMediaElementSource(music);
  audioState.musicSource.connect(audioState.musicGain);
}

function updateAudioVolume() {
  if (audioState.master) {
    audioState.master.gain.setTargetAtTime(audioState.enabled ? 1 : 0, audioState.context.currentTime, 0.025);
  }
  if (audioState.musicGain) {
    audioState.musicGain.gain.setTargetAtTime(audioState.volume, audioState.context.currentTime, 0.025);
  }
  soundButton.textContent = audioState.enabled ? '音效' : '靜音';
  soundButton.classList.toggle('muted', !audioState.enabled);
  localStorage.setItem('veggieMergeSoundEnabled', String(audioState.enabled));
  localStorage.setItem('veggieMergeVolume', String(audioState.volume));
}

function makeOsc({ frequency, type = 'sine', gain = 0.2, start = 0, duration = 0.2, target = null }) {
  const context = ensureAudio();
  const output = target || audioState.sfxGain;
  if (!context || !output || !audioState.enabled) return;

  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const now = context.currentTime + start;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(envelope);
  envelope.connect(output);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.04);
  return oscillator;
}

function playClickSound() {
  makeOsc({ frequency: 520, type: 'triangle', gain: 0.08, duration: 0.08 });
}

function playDropSound(level = 0) {
  makeOsc({ frequency: 180 + level * 24, type: 'triangle', gain: 0.14, duration: 0.11 });
  makeOsc({ frequency: 90, type: 'sine', gain: 0.06, start: 0.02, duration: 0.12 });
}

function playMergeSound(combo = 1, level = 0) {
  const base = 300 + level * 28 + Math.min(combo, 18) * 16;
  makeOsc({ frequency: base, type: 'sawtooth', gain: 0.13, duration: 0.12 });
  makeOsc({ frequency: base * 1.5, type: 'triangle', gain: 0.1, start: 0.05, duration: 0.16 });
  makeOsc({ frequency: base * 2, type: 'sine', gain: 0.08, start: 0.12, duration: 0.18 });
  playComboImpactSound(combo);
}

function playComboImpactSound(combo = 1) {
  const context = ensureAudio();
  if (!context || !audioState.enabled) return;

  const now = context.currentTime;
  const punch = context.createOscillator();
  const punchGain = context.createGain();
  punch.type = 'square';
  punch.frequency.setValueAtTime(86 + Math.min(combo, 20) * 3, now);
  punch.frequency.exponentialRampToValueAtTime(38, now + 0.16);
  punchGain.gain.setValueAtTime(Math.min(0.34, 0.16 + combo * 0.012), now);
  punchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  punch.connect(punchGain);
  punchGain.connect(audioState.sfxGain);
  punch.start(now);
  punch.stop(now + 0.22);

  const burst = context.createBufferSource();
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.12), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }
  const filter = context.createBiquadFilter();
  const burstGain = context.createGain();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(700 + Math.min(combo, 20) * 45, now);
  filter.Q.value = 5;
  burstGain.gain.setValueAtTime(0.08, now);
  burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  burst.buffer = buffer;
  burst.connect(filter);
  filter.connect(burstGain);
  burstGain.connect(audioState.sfxGain);
  burst.start(now);

  navigator.vibrate?.(Math.min(80, 24 + combo * 3));
}

function playGameOverSound() {
  makeOsc({ frequency: 240, type: 'triangle', gain: 0.14, duration: 0.18 });
  makeOsc({ frequency: 180, type: 'triangle', gain: 0.12, start: 0.14, duration: 0.22 });
  makeOsc({ frequency: 120, type: 'sine', gain: 0.12, start: 0.34, duration: 0.34 });
}

function startMusic() {
  const context = ensureAudio();
  if (!context || !audioState.musicElement || !audioState.enabled || !state.hasStarted || state.gameOver) return;

  audioState.musicElement.play().catch(() => {});
}

function stopMusic() {
  if (audioState.musicElement) {
    audioState.musicElement.pause();
  }
}

function randomSpawnLevel() {
  const roll = Math.random();
  if (roll < 0.4) return 0;
  if (roll < 0.7) return 1;
  if (roll < 0.9) return 2;
  return 3;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function levelLabel(level) {
  return `${level + 1} 層 ${VEGETABLES[level].name}`;
}

function setNextLevel() {
  state.nextLevel = randomSpawnLevel();
  nextLabelEl.textContent = `下一顆: ${levelLabel(state.nextLevel)}`;
}

function updateHud() {
  scoreEl.textContent = `分數 ${state.score}`;
  bestLevelEl.textContent = `最高 ${state.bestLevel}`;
  finalScoreEl.textContent = `分數 ${state.score}`;
  finalComboEl.textContent = `Combo ${state.bestCombo}`;
}

function comboDurationFor(combo) {
  if (combo <= 0) return 0;
  return Math.min(COMBO_MAX_DURATION, COMBO_BASE_DURATION * Math.pow(COMBO_GROWTH, combo - 1));
}

function comboColor(combo) {
  return COMBO_COLORS[Math.max(0, combo - 1) % COMBO_COLORS.length];
}

function scoreWithComboBonus(baseScore, combo) {
  const rawScore = baseScore * (1 + combo * 0.01);
  const wholeScore = Math.floor(rawScore);
  state.scoreRemainder += rawScore - wholeScore;
  const carriedScore = Math.floor(state.scoreRemainder);
  state.scoreRemainder -= carriedScore;
  return wholeScore + carriedScore;
}

function clearExpiredCombo(now = performance.now()) {
  if (state.combo > 0 && now >= state.comboExpiresAt) {
    state.combo = 0;
    state.comboDuration = 0;
    state.comboExpiresAt = 0;
  }
}

function setPaused(paused) {
  if (!state.hasStarted || state.gameOver) return;
  state.paused = paused;
  state.aiming = false;
  engine.timing.timeScale = paused ? 0 : 1;
  pausePanel.hidden = !paused;
  pauseButton.textContent = paused ? '繼續' : '暫停';
  if (paused) {
    playClickSound();
  } else {
    ensureAudio();
    startMusic();
    playClickSound();
  }
}

function togglePause() {
  setPaused(!state.paused);
}

function registerCombo(now = performance.now()) {
  clearExpiredCombo(now);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.comboDuration = comboDurationFor(state.combo);
  state.comboExpiresAt = now + state.comboDuration;
  state.comboPulseStartedAt = now;
  state.comboPulseColor = comboColor(state.combo);
  return state.combo;
}

function pushComboBurst(x, y, combo, now = performance.now()) {
  comboBursts.push({
    x,
    y,
    combo,
    color: comboColor(combo),
    startedAt: now
  });
}

function createWallBodies() {
  const thickness = 80;
  walls.floor = Bodies.rectangle(state.width / 2, state.height + thickness / 2, state.width, thickness, {
    isStatic: true,
    label: 'wall',
    render: { fillStyle: '#4f6f3a' }
  });
  walls.left = Bodies.rectangle(-thickness / 2, state.height / 2, thickness, state.height * 2, {
    isStatic: true,
    label: 'wall',
    render: { visible: false }
  });
  walls.right = Bodies.rectangle(state.width + thickness / 2, state.height / 2, thickness, state.height * 2, {
    isStatic: true,
    label: 'wall',
    render: { visible: false }
  });
  Composite.add(world, [walls.floor, walls.left, walls.right]);
}

function resizeGame() {
  const rect = container.getBoundingClientRect();
  state.width = Math.max(300, Math.floor(rect.width));
  state.height = Math.max(520, Math.floor(rect.height));
  state.dangerY = Math.max(112, Math.min(152, Math.round(state.height * 0.22)));
  state.aimX = state.aimX || state.width / 2;

  if (typeof Render.setSize === 'function') {
    Render.setSize(render, state.width, state.height);
  } else {
    render.canvas.width = state.width * render.options.pixelRatio;
    render.canvas.height = state.height * render.options.pixelRatio;
    render.canvas.style.width = `${state.width}px`;
    render.canvas.style.height = `${state.height}px`;
    render.options.width = state.width;
    render.options.height = state.height;
  }
  render.bounds.max.x = state.width;
  render.bounds.max.y = state.height;

  if (walls.floor) {
    Composite.remove(world, [walls.floor, walls.left, walls.right]);
  }
  createWallBodies();
}

function vegetableOptions(level) {
  const veg = VEGETABLES[level];
  return {
    restitution: 0.36,
    friction: 0.035,
    frictionAir: 0.002,
    density: 0.0011 + level * 0.00008,
    label: 'vegetable',
    render: {
      fillStyle: veg.color,
      strokeStyle: 'rgba(35, 55, 28, 0.18)',
      lineWidth: 2,
      visible: false
    }
  };
}

function createVegetable(level, x, y) {
  const veg = VEGETABLES[level];
  const body = Bodies.circle(x, y, veg.radius, vegetableOptions(level));
  body.vegLevel = level;
  body.spawnedAt = performance.now();
  body.canTriggerDangerAt = body.spawnedAt + 1400;
  body.dangerEnteredAt = null;
  body.isMerging = false;
  Composite.add(world, body);
  state.bestLevel = Math.max(state.bestLevel, level + 1);
  updateHud();
  return body;
}

function dropVegetable() {
  if (!state.hasStarted || state.paused || state.gameOver) return;
  const now = performance.now();
  if (now - state.lastDropAt < 260) return;
  const cfg = VEGETABLES[state.nextLevel];
  const x = clamp(state.aimX, cfg.radius + 8, state.width - cfg.radius - 8);
  const body = createVegetable(state.nextLevel, x, 72);
  Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.2, y: 0 });
  Body.setAngle(body, (Math.random() - 0.5) * 0.7);
  Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.16);
  playDropSound(state.nextLevel);
  state.lastDropAt = now;
  setNextLevel();
}

function pointerX(event) {
  const rect = render.canvas.getBoundingClientRect();
  return event.clientX - rect.left;
}

function startAim(event) {
  if (!state.hasStarted || state.paused || state.gameOver) return;
  state.aiming = true;
  state.pointerId = event.pointerId;
  state.aimX = pointerX(event);
  render.canvas.setPointerCapture?.(event.pointerId);
}

function moveAim(event) {
  if (!state.aiming || state.pointerId !== event.pointerId) return;
  state.aimX = pointerX(event);
}

function endAim(event) {
  if (!state.aiming || state.pointerId !== event.pointerId) return;
  state.aimX = pointerX(event);
  state.aiming = false;
  state.pointerId = null;
  render.canvas.releasePointerCapture?.(event.pointerId);
  dropVegetable();
}

function mergeVegetables(a, b) {
  if (a.isMerging || b.isMerging || a.vegLevel !== b.vegLevel || a.vegLevel >= VEGETABLES.length - 1) {
    return;
  }

  a.isMerging = true;
  b.isMerging = true;
  const nextLevel = a.vegLevel + 1;
  const midpoint = {
    x: (a.position.x + b.position.x) / 2,
    y: (a.position.y + b.position.y) / 2
  };
  const carryVelocity = Vector.mult(Vector.add(a.velocity, b.velocity), 0.28);

  requestAnimationFrame(() => {
    Composite.remove(world, [a, b]);
    if (state.gameOver) return;
    const merged = createVegetable(nextLevel, midpoint.x, midpoint.y);
    Body.setVelocity(merged, { x: carryVelocity.x, y: Math.min(carryVelocity.y - 2.4, -1.2) });
    Body.setAngle(merged, (a.angle + b.angle) / 2);
    Body.setAngularVelocity(merged, (Math.random() - 0.5) * 0.26);
    const combo = registerCombo();
    pushComboBurst(midpoint.x, midpoint.y, combo);
    playMergeSound(combo, nextLevel);
    state.score += scoreWithComboBonus(nextLevel + 1, combo);
    updateHud();
  });
}

function resetGame() {
  for (const body of Composite.allBodies(world)) {
    if (body.label === 'vegetable') {
      Composite.remove(world, body);
    }
  }
  state.score = 0;
  state.scoreRemainder = 0;
  state.bestLevel = 1;
  state.gameOver = false;
  state.aiming = false;
  state.paused = false;
  engine.timing.timeScale = 1;
  state.combo = 0;
  state.bestCombo = 0;
  state.comboDuration = 0;
  state.comboExpiresAt = 0;
  state.comboPulseStartedAt = 0;
  state.scoreSaved = false;
  comboBursts.length = 0;
  gameOverPanel.hidden = true;
  pausePanel.hidden = true;
  pauseButton.textContent = '暫停';
  setNextLevel();
  updateHud();
  startMusic();
}

function startGame() {
  ensureAudio();
  startMusic();
  playClickSound();
  if (state.hasStarted) return;
  state.hasStarted = true;
  startScene.hidden = true;
  resetGame();
}

function finishGame() {
  if (state.gameOver) return;
  state.gameOver = true;
  state.aiming = false;
  state.paused = false;
  engine.timing.timeScale = 1;
  pausePanel.hidden = true;
  pauseButton.textContent = '暫停';
  finalScoreEl.textContent = `分數 ${state.score}`;
  finalComboEl.textContent = `Combo ${state.bestCombo}`;
  gameOverPanel.hidden = false;
  stopMusic();
  playGameOverSound();
  submitLeaderboardScore();
}

function checkDangerLine() {
  if (!state.hasStarted || state.paused || state.gameOver) return;
  const now = performance.now();
  clearExpiredCombo(now);
  const bodies = Composite.allBodies(world).filter((body) => body.label === 'vegetable' && !body.isMerging);
  for (const body of bodies) {
    if (now < body.canTriggerDangerAt || body.position.y < state.dangerY) {
      body.dangerEnteredAt = null;
      continue;
    }
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const isRestingAboveLine = body.bounds.min.y < state.dangerY && speed < 0.45;
    body.dangerEnteredAt = isRestingAboveLine ? (body.dangerEnteredAt ?? now) : null;
    if (body.dangerEnteredAt && now - body.dangerEnteredAt >= 2000) {
      finishGame();
      return;
    }
  }
}

function drawVegetableSprite(ctx, level, x, y, radius, alpha = 1, angle = 0) {
  const veg = VEGETABLES[level];
  const image = vegetableImages[level];
  if (image && image.complete && image.naturalWidth > 0) {
    const maxSize = radius * 2.45;
    const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = veg.color;
  ctx.strokeStyle = 'rgba(35, 55, 28, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawComboBar(ctx, now) {
  if (state.combo <= 0 || state.comboDuration <= 0) return;

  const progress = clamp((state.comboExpiresAt - now) / state.comboDuration, 0, 1);
  if (progress <= 0) return;

  const width = Math.min(116, state.width * 0.32);
  const height = 9;
  const x = state.width - width - 12;
  const y = 88;
  const radius = 5;
  const pulse = Math.max(0, 1 - (now - state.comboPulseStartedAt) / COMBO_IMPACT_DURATION);
  const accent = comboColor(state.combo);

  ctx.save();
  ctx.font = `${800 + Math.round(pulse) * 100} ${12 + pulse * 3}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = pulse > 0 ? accent : 'rgba(40, 59, 31, 0.88)';
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12 * pulse;
  ctx.fillText(`COMBO ${state.combo}`, x + width, y - 4);

  ctx.beginPath();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(48, 78, 35, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  roundedRect(ctx, x, y, width * progress, height, radius);
  ctx.fillStyle = progress > 0.32 ? accent : '#ff634f';
  ctx.fill();
  ctx.restore();
}

function drawComboImpact(ctx, now) {
  const pulse = Math.max(0, 1 - (now - state.comboPulseStartedAt) / COMBO_IMPACT_DURATION);
  if (pulse > 0 && state.combo > 0) {
    ctx.save();
    ctx.globalAlpha = 0.16 * pulse;
    ctx.fillStyle = state.comboPulseColor;
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.globalAlpha = 0.75 * pulse;
    ctx.strokeStyle = state.comboPulseColor;
    ctx.lineWidth = 7 * pulse + 2;
    ctx.strokeRect(4, 4, state.width - 8, state.height - 8);
    ctx.restore();
  }

  for (let i = comboBursts.length - 1; i >= 0; i--) {
    const burst = comboBursts[i];
    const age = now - burst.startedAt;
    const t = age / COMBO_IMPACT_DURATION;
    if (t >= 1) {
      comboBursts.splice(i, 1);
      continue;
    }

    const ease = 1 - Math.pow(1 - t, 3);
    const alpha = 1 - t;
    const ringRadius = 20 + 58 * ease + Math.min(burst.combo, 18) * 1.4;
    const textY = burst.y - 22 - 34 * ease;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = burst.color;
    ctx.lineWidth = 8 * (1 - ease) + 2;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `900 ${22 + Math.min(burst.combo, 18) * 0.8}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillStyle = burst.color;
    ctx.shadowColor = burst.color;
    ctx.shadowBlur = 18;
    ctx.strokeText(`COMBO ${burst.combo}`, burst.x, textY);
    ctx.fillText(`COMBO ${burst.combo}`, burst.x, textY);
    ctx.restore();
  }
}

function drawGameOverlay() {
  const ctx = render.context;
  const now = performance.now();
  const shakeProgress = Math.max(0, 1 - (now - state.comboPulseStartedAt) / COMBO_SHAKE_DURATION);
  const shakeStrength = Math.min(16, 4 + state.combo * 0.55) * shakeProgress * shakeProgress;

  ctx.save();
  if (shakeStrength > 0) {
    ctx.translate(
      Math.sin(now * 0.075) * shakeStrength,
      Math.cos(now * 0.091) * shakeStrength * 0.65
    );
  }
  ctx.strokeStyle = 'rgba(203, 93, 67, 0.85)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, state.dangerY);
  ctx.lineTo(state.width, state.dangerY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(203, 93, 67, 0.92)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('危險線', state.width - 12, state.dangerY - 8);

  const dangerTimes = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && body.dangerEnteredAt)
    .map((body) => body.dangerEnteredAt);
  if (dangerTimes.length && !state.gameOver) {
    const oldestDangerAt = Math.min(...dangerTimes);
    const remaining = Math.max(0, 2 - (now - oldestDangerAt) / 1000);
    ctx.textAlign = 'left';
    ctx.fillText(`${remaining.toFixed(1)} 秒`, 12, state.dangerY - 8);
  }

  const preview = VEGETABLES[state.nextLevel];
  const x = clamp(state.aimX || state.width / 2, preview.radius + 8, state.width - preview.radius - 8);
  const y = 70;
  drawVegetableSprite(ctx, state.nextLevel, x, y, preview.radius, state.aiming ? 0.92 : 0.72);

  if (state.aiming) {
    ctx.strokeStyle = 'rgba(45, 70, 35, 0.45)';
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(x, y + preview.radius + 12);
    ctx.lineTo(x, state.height - 12);
    ctx.stroke();
  }

  for (const body of Composite.allBodies(world)) {
    if (body.label !== 'vegetable') continue;
    const veg = VEGETABLES[body.vegLevel];
    drawVegetableSprite(ctx, body.vegLevel, body.position.x, body.position.y, veg.radius, 1, body.angle);
  }

  ctx.restore();
  drawComboImpact(ctx, now);
  drawComboBar(ctx, now);
}

Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    const a = pair.bodyA;
    const b = pair.bodyB;
    if (a.label === 'vegetable' && b.label === 'vegetable') {
      mergeVegetables(a, b);
    }
  }
});

Events.on(engine, 'afterUpdate', checkDangerLine);
Events.on(render, 'afterRender', drawGameOverlay);

render.canvas.addEventListener('pointerdown', startAim);
render.canvas.addEventListener('pointermove', moveAim);
render.canvas.addEventListener('pointerup', endAim);
render.canvas.addEventListener('pointercancel', endAim);
startButton.addEventListener('click', startGame);
startScene.addEventListener('click', startGame);
startLeaderboardButton.addEventListener('click', (event) => {
  event.stopPropagation();
  openLeaderboard('score');
});
gameOverLeaderboardButton.addEventListener('click', () => openLeaderboard('score'));
closeLeaderboardButton.addEventListener('click', closeLeaderboard);
scoreTabButton.addEventListener('click', () => openLeaderboard('score'));
comboTabButton.addEventListener('click', () => openLeaderboard('combo'));
googleSignInButton.addEventListener('click', signInWithGoogle);
pauseButton.addEventListener('click', togglePause);
resumeButton.addEventListener('click', () => setPaused(false));
soundButton.addEventListener('click', () => {
  ensureAudio();
  audioState.enabled = !audioState.enabled;
  updateAudioVolume();
  if (audioState.enabled) {
    playClickSound();
    startMusic();
  } else {
    stopMusic();
  }
});
volumeSlider.addEventListener('input', () => {
  ensureAudio();
  audioState.volume = Number(volumeSlider.value) / 100;
  if (audioState.volume > 0) {
    audioState.enabled = true;
  }
  updateAudioVolume();
  startMusic();
});
restartButton.addEventListener('click', resetGame);
playAgainButton.addEventListener('click', resetGame);
window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', () => setTimeout(resizeGame, 250));

setupSupabase();
setupAudioUi();
resizeGame();
setNextLevel();
updateHud();
Render.run(render);
Runner.run(runner, engine);
