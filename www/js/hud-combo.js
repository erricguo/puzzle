function setNextLevel() {
  state.nextLevel = randomSpawnLevel();
  nextLabelEl.textContent = state.fertilizerCharges > 0
    ? `肥料剩餘: ${state.fertilizerCharges}`
    : `下一顆: ${levelLabel(state.nextLevel)}`;
}

function updateHud() {
  scoreEl.textContent = `分數 ${state.score}`;
  bestLevelEl.textContent = `最高 Combo ${state.bestCombo}`;
  playerLevelEl.textContent = `Lv ${state.playerLevel} ${state.exp}/${state.expToNext}`;
  expFillEl.style.width = `${clamp((state.exp / state.expToNext) * 100, 0, 100)}%`;
  finalScoreEl.textContent = `分數 ${state.score}`;
  finalComboEl.textContent = `最高 Combo ${state.bestCombo}`;
}

function comboDurationFor(combo) {
  if (combo <= 0) return 0;
  const bonus = talentComboDurationBonus() + environmentComboBonus();
  return Math.min(COMBO_MAX_DURATION + bonus, COMBO_BASE_DURATION * Math.pow(COMBO_GROWTH, combo - 1) + bonus);
}

function comboColor(combo) {
  return COMBO_COLORS[Math.max(0, combo - 1) % COMBO_COLORS.length];
}

function comboScoreMultiplier(combo) {
  return combo > 0 ? 1 + (combo + state.comboScoreBonus) * 0.4 : 1;
}

function scoreWithComboBonus(baseScore, combo) {
  const rawScore = baseScore * comboScoreMultiplier(combo);
  const wholeScore = Math.floor(rawScore);
  state.scoreRemainder += rawScore - wholeScore;
  const carriedScore = Math.floor(state.scoreRemainder);
  state.scoreRemainder -= carriedScore;
  return wholeScore + carriedScore;
}

function experienceWithComboBonus(baseExperience, combo) {
  const rawExperience = baseExperience * comboScoreMultiplier(combo);
  const wholeExperience = Math.floor(rawExperience);
  state.expRemainder += rawExperience - wholeExperience;
  const carriedExperience = Math.floor(state.expRemainder);
  state.expRemainder -= carriedExperience;
  return wholeExperience + carriedExperience;
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
  if (comboBursts.length >= 4) {
    comboBursts.shift();
  }
  comboBursts.push({
    x,
    y,
    combo,
    color: comboColor(combo),
    startedAt: now
  });
}
