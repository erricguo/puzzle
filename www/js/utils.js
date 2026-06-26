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

function createGuestDisplayName() {
  return `Guest ${Math.floor(Math.random() * 9000 + 1000)}`;
}

function loadLocalLeaderboard() {
  return [];
}

function loadEncyclopediaLevels() {
  return [0];
}

function loadDailyMissionState() {
  return {};
}

function loadPlayerCoins() {
  return 0;
}

function loadReviveTickets() {
  return STARTING_REVIVE_TICKETS;
}

function loadBombs() {
  return 0;
}

function loadOwnedTalents() {
  return [];
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
