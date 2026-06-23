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
  finalComboEl.textContent = `最高 Combo ${state.bestCombo}`;
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
