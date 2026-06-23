function setNextLevel() {
  state.nextLevel = randomSpawnLevel();
  nextLabelEl.textContent = `下一顆: ${levelLabel(state.nextLevel)}`;
}

function updateHud() {
  scoreEl.textContent = `分數 ${state.score}`;
  bestLevelEl.textContent = `最高 ${state.bestLevel}`;
  playerLevelEl.textContent = `Lv ${state.playerLevel} ${state.exp}/${state.expToNext}`;
  expFillEl.style.width = `${clamp((state.exp / state.expToNext) * 100, 0, 100)}%`;
  finalScoreEl.textContent = `分數 ${state.score}`;
  finalComboEl.textContent = `最高 Combo ${state.bestCombo}`;
}

function comboDurationFor(combo) {
  if (combo <= 0) return 0;
  return Math.min(COMBO_MAX_DURATION, COMBO_BASE_DURATION * Math.pow(COMBO_GROWTH, combo - 1));
}

function comboColor(combo) {
  return COMBO_COLORS[Math.max(0, combo - 1) % COMBO_COLORS.length];
}

function scoreWithComboBonus(baseScore, combo) {
  const rawScore = baseScore * (1 + (combo + state.comboScoreBonus) * 0.01);
  const wholeScore = Math.floor(rawScore);
  state.scoreRemainder += rawScore - wholeScore;
  const carriedScore = Math.floor(state.scoreRemainder);
  state.scoreRemainder -= carriedScore;
  return wholeScore + carriedScore;
}

function clearExpiredCombo(now = performance.now()) {
  if (isComboFrozen(now)) {
    if (state.combo > 0 && state.comboFreezeLastAt > 0) {
      state.comboExpiresAt += now - state.comboFreezeLastAt;
    }
    state.comboFreezeLastAt = now;
    return;
  }

  state.comboFreezeLastAt = 0;
  if (state.combo > 0 && now >= state.comboExpiresAt) {
    state.combo = 0;
    state.comboDuration = 0;
    state.comboExpiresAt = 0;
  }
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
