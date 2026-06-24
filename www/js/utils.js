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

function loadEncyclopediaLevels() {
  try {
    const stored = JSON.parse(localStorage.getItem('veggieMergeEncyclopediaLevels') || '[0]');
    const levels = Array.isArray(stored) ? stored : [0];
    const validLevels = levels
      .map((level) => Number(level))
      .filter((level) => Number.isInteger(level) && level >= 0 && level < VEGETABLES.length);
    return [...new Set([0, ...validLevels])].sort((a, b) => a - b);
  } catch {
    return [0];
  }
}

function loadDailyMissionState() {
  try {
    const stored = JSON.parse(localStorage.getItem('veggieMergeDailyMissions') || '{}');
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    return {};
  }
}

function loadPlayerCoins() {
  const coins = Number(localStorage.getItem('veggieMergeCoins') || 0);
  return Number.isFinite(coins) && coins > 0 ? Math.floor(coins) : 0;
}

function loadOwnedTalents() {
  try {
    const stored = JSON.parse(localStorage.getItem('veggieMergeOwnedTalents') || '[]');
    return Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
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
