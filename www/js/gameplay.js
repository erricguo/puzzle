function setPaused(paused) {
  if (!state.hasStarted || state.gameOver || state.isChoosingSkill) return;
  state.paused = paused;
  state.aiming = false;
  if (paused) {
    state.bombTargeting = false;
  }
  engine.timing.timeScale = paused ? 0 : 1;
  pausePanel.hidden = !paused;
  pauseButton.textContent = paused ? '繼續' : '暫停';
  updateNextLabelStatus();
  updateHud();
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
  const nextWidth = Math.max(300, Math.floor(rect.width));
  const nextHeight = Math.max(520, Math.floor(rect.height));
  const sizeChanged = nextWidth !== state.width || nextHeight !== state.height;
  state.width = nextWidth;
  state.height = nextHeight;
  state.dangerY = Math.max(112, Math.min(152, Math.round(state.height * 0.22)));
  state.aimX = state.aimX || state.width / 2;

  const nextPixelRatio = Math.min(window.devicePixelRatio || 1, 3);
  if (render.options.pixelRatio !== nextPixelRatio) {
    render.options.pixelRatio = nextPixelRatio;
    if (typeof Render.setPixelRatio === 'function') {
      Render.setPixelRatio(render, nextPixelRatio);
    }
  }

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
  uiOverlay.style.width = `${state.width}px`;
  uiOverlay.style.height = `${state.height}px`;

  if (!sizeChanged && walls.floor) return;
  if (state.paused && walls.floor) return;

  if (walls.floor) {
    Composite.remove(world, [walls.floor, walls.left, walls.right]);
  }
  createWallBodies();
  state.wallWidth = state.width;
  state.wallHeight = state.height;
}

function vegetableOptions(level) {
  const veg = VEGETABLES[level];
  const baseFriction = 0.015;
  return {
    restitution: 0.36,
    friction: rainFrictionFor(baseFriction),
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
  body.corruptionProgress = 0;
  body.corruptionElapsed = 0;
  body.isCorrupted = false;
  body.canTriggerDangerAt = body.spawnedAt + 1400;
  body.dangerEnteredAt = null;
  body.isMerging = false;
  Composite.add(world, body);
  state.bestLevel = Math.max(state.bestLevel, level + 1);
  updateHud();
  return body;
}

function createFertilizer(x, y) {
  const body = Bodies.circle(x, y, 18, {
    restitution: 0.22,
    friction: 0.04,
    frictionAir: 0.002,
    density: 0.001,
    label: 'fertilizer',
    render: { visible: false }
  });
  body.spawnedAt = performance.now();
  body.isConsumed = false;
  Composite.add(world, body);
  return body;
}

function dropVegetable() {
  if (!state.hasStarted || state.paused || state.gameOver) return;
  const now = performance.now();
  if (now < state.suppressDropUntil) return;
  if (now - state.lastDropAt < dropCooldownFor(now)) return;

  if (state.fertilizerCharges > 0) {
    const x = clamp(state.aimX, 26, state.width - 26);
    const fertilizer = createFertilizer(x, 72);
    const dropVelocityMultiplier = talentDropVelocityMultiplier() * (isPrecisionAimActive(now) ? 0.55 : 1);
    Body.setVelocity(fertilizer, { x: (Math.random() - 0.5) * 0.9 * dropVelocityMultiplier + windVelocityOffset(now), y: 0 });
    Body.setAngle(fertilizer, (Math.random() - 0.5) * 0.5);
    Body.setAngularVelocity(fertilizer, (Math.random() - 0.5) * 0.18);
    state.fertilizerCharges = Math.max(0, state.fertilizerCharges - 1);
    playDropSound(2);
    state.lastDropAt = now;
    setNextLevel();
    return;
  }

  const cfg = VEGETABLES[state.nextLevel];
  const x = clamp(state.aimX, cfg.radius + 8, state.width - cfg.radius - 8);
  const body = createVegetable(state.nextLevel, x, 72);
  const windOffset = windVelocityOffset(now);
  const dropVelocityMultiplier = talentDropVelocityMultiplier() * (isPrecisionAimActive(now) ? 0.55 : 1);
  Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.2 * dropVelocityMultiplier + windOffset, y: 0 });
  Body.setAngle(body, (Math.random() - 0.5) * 0.7);
  Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.16);
  if (isDoubleDropActive(now)) {
    const offset = cfg.radius + 10;
    const secondX = clamp(x + (x < state.width / 2 ? offset : -offset), cfg.radius + 8, state.width - cfg.radius - 8);
    const second = createVegetable(state.nextLevel, secondX, 72);
    Body.setVelocity(second, { x: (Math.random() - 0.5) * 1.2 * dropVelocityMultiplier + windOffset * 0.8, y: 0 });
    Body.setAngle(second, (Math.random() - 0.5) * 0.7);
    Body.setAngularVelocity(second, (Math.random() - 0.5) * 0.16);
  }
  playDropSound(state.nextLevel);
  state.lastDropAt = now;
  setNextLevel();
}

function pointerX(event) {
  const rect = render.canvas.getBoundingClientRect();
  return event.clientX - rect.left;
}

function pointerPoint(event) {
  const rect = render.canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function startAim(event) {
  if (event.button !== 0) return;
  if (state.bombTargeting) {
    useBombAtPoint(pointerPoint(event));
    return;
  }
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
  if (event.button !== 0) return;
  if (performance.now() < state.suppressDropUntil) {
    state.aiming = false;
    state.pointerId = null;
    render.canvas.releasePointerCapture?.(event.pointerId);
    return;
  }
  if (!state.aiming || state.pointerId !== event.pointerId) return;
  state.aimX = pointerX(event);
  state.aiming = false;
  state.pointerId = null;
  render.canvas.releasePointerCapture?.(event.pointerId);
  dropVegetable();
}

function mergeVegetables(a, b) {
  if (
    state.debugMergeDisabled ||
    a.isMerging ||
    b.isMerging ||
    a.isBlasting ||
    b.isBlasting ||
    a.isCorrupted ||
    b.isCorrupted ||
    a.vegLevel !== b.vegLevel ||
    a.vegLevel >= VEGETABLES.length - 1
  ) {
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
    unlockEncyclopediaLevel(nextLevel);
    Body.setVelocity(merged, { x: carryVelocity.x, y: Math.min(carryVelocity.y - 2.4, -1.2) });
    Body.setAngle(merged, (a.angle + b.angle) / 2);
    Body.setAngularVelocity(merged, (Math.random() - 0.5) * 0.26);
    const combo = registerCombo();
    pushComboBurst(midpoint.x, midpoint.y, combo);
    playMergeSound(combo, nextLevel);
    const baseScore = MERGE_SCORE_BY_LEVEL[nextLevel] ?? (nextLevel + 1);
    const scoreGain = scoreWithComboBonus(baseScore, combo);
    state.score += scoreGain;
    recordDailyMissionProgress('merge', 1);
    recordDailyMissionProgress('combo', combo);
    recordDailyMissionProgress('level', nextLevel + 1);
    recordDailyMissionProgress('score', state.score);
    gainExperience(scoreGain);
    updateHud();
  });
}

function resetGame() {
  for (const body of Composite.allBodies(world)) {
    if (body.label === 'vegetable' || body.label === 'fertilizer') {
      Composite.remove(world, body);
    }
  }
  state.score = 0;
  state.scoreRemainder = 0;
  state.bestLevel = 1;
  state.previewLevel = null;
  state.gameOver = false;
  state.gameOverActionsLocked = false;
  state.aiming = false;
  state.bombTargeting = false;
  state.bombsUsedThisRun = 0;
  state.paused = false;
  engine.timing.timeScale = 1;
  state.suppressDropUntil = 0;
  resetSkillState();
  state.combo = 0;
  state.bestCombo = 0;
  state.comboDuration = 0;
  state.comboExpiresAt = 0;
  state.comboPulseStartedAt = 0;
  state.corruptionActive = false;
  state.corruptionLastAt = 0;
  state.debugCorruptionUnlocked = false;
  state.debugMergeDisabled = false;
  state.activeEnvironmentEvents = [];
  state.environmentEventsPausedAt = 0;
  state.nextEnvironmentEventRollAt = 0;
  state.itemBoardRun = false;
  state.reviveUsedThisRun = false;
  state.scoreSaved = false;
  leaderboardState.recentScoreRow = null;
  leaderboardState.recentScoreRank = null;
  comboBursts.length = 0;
  comboInsuranceEffects.length = 0;
  gameOverPanel.hidden = true;
  gameOverPanel.classList.remove('entering');
  pausePanel.hidden = true;
  skillPanel.hidden = true;
  pauseButton.textContent = '暫停';
  setNextLevel();
  applyStartTalents();
  updateHud();
  startMusic();
}

function startGame() {
  if (!leaderboardState.isIdentityReady || !leaderboardState.user) {
    accountStatusEl.textContent = 'Connecting to Supabase...';
    syncSupabaseUser?.();
    return;
  }
  ensureAudio();
  startMusic();
  playClickSound();
  if (state.hasStarted) return;
  state.hasStarted = true;
  startScene.hidden = true;
  resetGame();
}

function finishGameLegacy() {
  return finishGame({
    openScoreLeaderboard: true,
    showGameOverPanel: false
  });
}

async function finishGame(options = {}) {
  const { openScoreLeaderboard = false, showGameOverPanel = true } = options;
  if (state.gameOver) return;

  state.gameOver = true;
  state.aiming = false;
  state.paused = false;
  engine.timing.timeScale = 1;
  pausePanel.hidden = true;
  skillPanel.hidden = true;
  debugPanel.hidden = true;
  pauseButton.textContent = '暫停';
  finalScoreEl.textContent = `分數 ${state.score}`;
  finalComboEl.textContent = `最高 Combo ${state.bestCombo}`;
  state.gameOverActionsLocked = showGameOverPanel;
  updateReviveButton();
  gameOverPanel.hidden = !showGameOverPanel;
  gameOverPanel.classList.toggle('entering', showGameOverPanel);
  setGameOverActionButtonsLocked(showGameOverPanel);
  if (showGameOverPanel) {
    window.setTimeout(() => {
      if (!state.gameOver || gameOverPanel.hidden) return;
      state.gameOverActionsLocked = false;
      setGameOverActionButtonsLocked(false);
      gameOverPanel.classList.remove('entering');
    }, 1500);
  }
  stopMusic();
  playGameOverSound();
  recordDailyMissionProgress('play', 1);
  const canRevive = showGameOverPanel && state.reviveTickets > 0 && !state.reviveUsedThisRun;
  const scoreSubmit = canRevive ? Promise.resolve(null) : submitLeaderboardScore();
  if (openScoreLeaderboard) {
    openLeaderboard(state.itemBoardRun ? 'item' : 'classic');
  }
  await scoreSubmit;

  if (openScoreLeaderboard && !leaderboardScene.hidden) {
    loadLeaderboard();
  }
}

async function openGameOverLeaderboard() {
  await submitLeaderboardScore();
  openLeaderboard(state.itemBoardRun ? 'item' : 'classic');
}

async function playAgainFromGameOver() {
  await submitLeaderboardScore();
  resetGame();
}

function saveReviveTickets() {
  queuePlayerProgressSync?.();
}

function saveBombs() {
  queuePlayerProgressSync?.();
}

function addReviveTickets(amount = 1) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return;
  state.reviveTickets += Math.floor(value);
  saveReviveTickets();
  updateReviveButton();
}

function addBombs(amount = 1) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return;
  state.bombs += Math.floor(value);
  saveBombs();
  updateHud();
}

function setGameOverActionButtonsLocked(locked) {
  const canRevive = state.reviveTickets > 0 && !state.reviveUsedThisRun;
  reviveButton.disabled = locked || !canRevive;
  gameOverLeaderboardButton.disabled = locked;
  playAgainButton.disabled = locked;
}

function updateReviveButton() {
  const canRevive = state.reviveTickets > 0 && !state.reviveUsedThisRun;
  reviveButton.disabled = state.gameOverActionsLocked || !canRevive;
  reviveButton.textContent = canRevive
    ? `使用復活券 x${state.reviveTickets}`
    : '沒有可用復活券';
}

function activateBombTargeting() {
  if (
    !state.hasStarted ||
    state.gameOver ||
    state.paused ||
    state.bombs <= 0 ||
    state.bombsUsedThisRun >= BOMB_USES_PER_RUN
  ) return;
  state.bombTargeting = !state.bombTargeting;
  state.aiming = false;
  state.pointerId = null;
  updateNextLabelStatus();
  updateHud();
  playClickSound();
}

function findVegetableAtPoint(point) {
  const bodies = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && !body.isMerging && !body.isBlasting);
  return bodies
    .map((body) => ({
      body,
      distance: Math.hypot(body.position.x - point.x, body.position.y - point.y),
      radius: VEGETABLES[body.vegLevel]?.radius || 0
    }))
    .filter((entry) => entry.distance <= entry.radius + 8)
    .sort((a, b) => a.distance - b.distance || b.body.position.y - a.body.position.y)[0]?.body || null;
}

function useBombAtPoint(point) {
  if (
    !state.bombTargeting ||
    state.bombs <= 0 ||
    state.bombsUsedThisRun >= BOMB_USES_PER_RUN ||
    state.gameOver ||
    state.paused
  ) return;
  const target = findVegetableAtPoint(point);
  if (!target) {
    updateNextLabelStatus();
    updateHud();
    return;
  }

  state.bombs = Math.max(0, state.bombs - 1);
  state.bombsUsedThisRun += 1;
  saveBombs();
  state.bombTargeting = false;
  state.itemBoardRun = true;
  blastVegetablesAround(target, ITEM_BOMB_RADIUS);
  updateNextLabelStatus();
  updateHud();
  playClickSound();
}

function blastVegetablesAround(target, radius = ITEM_BOMB_RADIUS) {
  const now = performance.now();
  const center = {
    x: target.position.x,
    y: target.position.y,
    radius
  };
  const bodies = Composite.allBodies(world)
    .filter((body) => (
      body.label === 'vegetable' &&
      !body.isMerging &&
      !body.isBlasting &&
      Math.hypot(body.position.x - center.x, body.position.y - center.y) <= center.radius
    ));
  if (!bodies.length) return false;

  bodies.forEach((body) => {
    body.isBlasting = true;
    body.blastStartedAt = now;
    body.blastOrigin = center;
    Body.setVelocity(body, {
      x: (body.position.x - center.x) * 0.035,
      y: -3.8 + Math.random() * -1.4
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.45);
  });

  blastEffects.push({
    x: center.x,
    y: center.y,
    startedAt: now,
    radius: center.radius
  });

  window.setTimeout(() => {
    const remaining = bodies.filter((body) => Composite.allBodies(world).includes(body));
    Composite.remove(world, remaining);
  }, BLAST_ANIMATION_DURATION);

  const scoreGain = scoreWithGoldenBonus(bodies.length);
  state.score += scoreGain;
  recordDailyMissionProgress('blast', bodies.length);
  recordDailyMissionProgress('score', state.score);
  updateHud();
  return true;
}

function useReviveTicket() {
  if (!state.gameOver || state.reviveUsedThisRun || state.reviveTickets <= 0) return;

  state.reviveTickets -= 1;
  state.reviveUsedThisRun = true;
  state.itemBoardRun = true;
  saveReviveTickets();
  blastTopVegetables(REVIVE_BLAST_COUNT);

  state.gameOver = false;
  state.gameOverActionsLocked = false;
  state.paused = false;
  state.aiming = false;
  state.pointerId = null;
  state.bombTargeting = false;
  state.suppressDropUntil = performance.now() + 650;
  Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable')
    .forEach((body) => {
      body.dangerEnteredAt = null;
      body.canTriggerDangerAt = performance.now() + 1600;
    });
  engine.timing.timeScale = 1;
  gameOverPanel.hidden = true;
  gameOverPanel.classList.remove('entering');
  leaderboardScene.hidden = true;
  pausePanel.hidden = true;
  skillPanel.hidden = true;
  debugPanel.hidden = true;
  pauseButton.textContent = '暫停';
  ensureAudio();
  startMusic();
  playClickSound();
  updateHud();
}

function blastTopVegetables(count) {
  const now = performance.now();
  const toRemove = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && !body.isMerging && !body.isBlasting)
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
    .slice(0, count);

  toRemove.forEach((body, index) => {
    body.isBlasting = true;
    body.blastStartedAt = now;
    const radius = blastRadiusFor(body);
    blastEffects.push({
      x: body.position.x,
      y: body.position.y,
      startedAt: now + index * 12,
      radius
    });
  });

  if (toRemove.length) {
    Composite.remove(world, toRemove);
    recordDailyMissionProgress('blast', toRemove.length);
  }
}

function endCurrentGame() {
  finishGame({
    openScoreLeaderboard: true,
    showGameOverPanel: false
  });
}

function returnToStartScene() {
  for (const body of Composite.allBodies(world)) {
    if (body.label === 'vegetable' || body.label === 'fertilizer') {
      Composite.remove(world, body);
    }
  }

  state.hasStarted = false;
  state.gameOver = false;
  state.gameOverActionsLocked = false;
  state.paused = false;
  state.aiming = false;
  state.pointerId = null;
  state.bombTargeting = false;
  state.score = 0;
  state.scoreRemainder = 0;
  state.bestLevel = 1;
  state.previewLevel = null;
  state.combo = 0;
  state.bestCombo = 0;
  state.comboDuration = 0;
  state.comboExpiresAt = 0;
  state.comboPulseStartedAt = 0;
  state.scoreSaved = false;
  state.activeEnvironmentEvents = [];
  state.environmentEventsPausedAt = 0;
  state.nextEnvironmentEventRollAt = 0;
  state.itemBoardRun = false;
  state.reviveUsedThisRun = false;
  state.bombsUsedThisRun = 0;
  leaderboardState.recentScoreRow = null;
  leaderboardState.recentScoreRank = null;
  comboBursts.length = 0;
  comboInsuranceEffects.length = 0;
  engine.timing.timeScale = 1;
  resetSkillState();
  leaderboardScene.hidden = true;
  talentScene.hidden = true;
  gameOverPanel.hidden = true;
  gameOverPanel.classList.remove('entering');
  pausePanel.hidden = true;
  skillPanel.hidden = true;
  debugPanel.hidden = true;
  startScene.hidden = false;
  pauseButton.textContent = '暫停';
  setNextLevel();
  updateHud();
  stopMusic();
}

function checkDangerLine() {
  if (!state.hasStarted || state.paused || state.gameOver) return;
  const now = performance.now();
  updateEnvironmentEvents(now);
  updateStrongWind(now);
  updateRainFriction(now);
  updateActiveSkills(now);
  updateCorruption(now);
  clearExpiredCombo(now);
  const bodies = Composite.allBodies(world).filter((body) => body.label === 'vegetable' && !body.isMerging && !body.isBlasting);
  for (const body of bodies) {
    if (now < body.canTriggerDangerAt || body.position.y < state.dangerY) {
      body.dangerEnteredAt = null;
      continue;
    }
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const isRestingAboveLine = body.bounds.min.y < state.dangerY && speed < 0.45;
    body.dangerEnteredAt = isRestingAboveLine ? (body.dangerEnteredAt ?? now) : null;
    if (body.dangerEnteredAt && now - body.dangerEnteredAt >= 2000 + talentDangerDelayBonus() + safetyCushionBonus(now)) {
      finishGame();
      return;
    }
  }
}

function isCorruptionUnlocked() {
  return state.debugCorruptionUnlocked
    || state.playerLevel >= CORRUPTION_UNLOCK_LEVEL;
}

function corruptionDurationForLevel(level) {
  if (level >= VEGETABLES.length - 1) return Infinity;
  return (level + 1) * CORRUPTION_SECONDS_PER_LEVEL * 1000;
}

function updateRainFriction(now = performance.now()) {
  const rainActive = isEnvironmentEventActive('heavy_rain', now);
  for (const body of Composite.allBodies(world)) {
    if (body.label !== 'vegetable') continue;
    const baseFriction = 0.015;
    const targetFriction = rainActive ? baseFriction * HEAVY_RAIN_FRICTION_MULTIPLIER : baseFriction;
    if (Math.abs(body.friction - targetFriction) > 0.0001) {
      body.friction = targetFriction;
    }
  }
}

function updateStrongWind(now = performance.now()) {
  if (!isEnvironmentEventActive('strong_wind', now)) return;

  for (const body of Composite.allBodies(world)) {
    if (body.label !== 'vegetable' || body.isMerging || body.isBlasting) continue;
    Body.applyForce(body, body.position, {
      x: windForceForBody(body, now) * body.mass,
      y: 0
    });
  }
}

function pumpkinAuraSources() {
  return Composite.allBodies(world).filter((body) => (
    body.label === 'vegetable' &&
    body.vegLevel === PUMPKIN_LEVEL &&
    !body.isMerging &&
    !body.isBlasting
  ));
}

function isProtectedByPumpkinAura(body, pumpkins = pumpkinAuraSources()) {
  return pumpkins.some((pumpkin) => (
    Math.hypot(body.position.x - pumpkin.position.x, body.position.y - pumpkin.position.y) <= PUMPKIN_AURA_RADIUS
  ));
}

function updateCorruption(now = performance.now()) {
  if (!isCorruptionUnlocked()) {
    state.corruptionActive = false;
    state.corruptionLastAt = now;
    return;
  }

  if (!state.corruptionActive) {
    state.corruptionActive = true;
  }

  const delta = state.corruptionLastAt ? Math.min(now - state.corruptionLastAt, 250) : 0;
  state.corruptionLastAt = now;
  if (delta <= 0) return;

  const pumpkins = pumpkinAuraSources();
  const bodies = Composite.allBodies(world)
    .filter((body) => (
      body.label === 'vegetable' &&
      !body.isMerging &&
      !body.isBlasting &&
      body.vegLevel < PUMPKIN_LEVEL &&
      now >= body.canTriggerDangerAt &&
      body.position.y > state.dangerY
    ));

  for (const body of bodies) {
    if (body.isCorrupted) continue;
    if (isProtectedByPumpkinAura(body, pumpkins)) continue;
    const duration = corruptionDurationForLevel(body.vegLevel);
    const corruptionGain = delta;
    const harvestRecovery = delta * harvestCorruptionRecovery(now);
    body.corruptionElapsed = Math.max(0, (body.corruptionElapsed || 0) + corruptionGain - harvestRecovery);
    const step = Math.floor((body.corruptionElapsed / duration) * 10);
    body.corruptionProgress = clamp(step / 10, 0, 1);
    if (body.corruptionProgress >= 1) {
      body.corruptionProgress = 1;
      body.isCorrupted = true;
      body.isMerging = false;
    }
  }
}
