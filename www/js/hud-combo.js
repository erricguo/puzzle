function setNextLevel() {
  state.nextLevel = Number.isInteger(state.previewLevel) ? state.previewLevel : randomSpawnLevel();
  state.previewLevel = randomSpawnLevel();
  updateNextLabelStatus();
}

function updateNextLabelStatus() {
  const statusText = state.bombTargeting
    ? '點選蔬菜引爆炸彈'
    : state.fertilizerCharges > 0
      ? `肥料剩餘: ${state.fertilizerCharges}`
      : '';
  nextLabelEl.hidden = !statusText;
  nextLabelEl.textContent = statusText;
}

function updateHud() {
  scoreEl.textContent = `分數 ${state.score}`;
  bestLevelEl.textContent = `最高 Combo ${state.bestCombo}`;
  playerLevelEl.textContent = `Lv ${state.playerLevel} ${state.exp}/${state.expToNext}`;
  expFillEl.style.width = `${clamp((state.exp / state.expToNext) * 100, 0, 100)}%`;
  finalScoreEl.textContent = `分數 ${state.score}`;
  finalComboEl.textContent = `最高 Combo ${state.bestCombo}`;
  const bombUsesRemaining = Math.max(0, BOMB_USES_PER_RUN - state.bombsUsedThisRun);
  bombButton.hidden = state.bombs <= 0;
  bombButton.disabled = state.bombs <= 0 || bombUsesRemaining <= 0 || !state.hasStarted || state.gameOver || state.paused;
  bombButton.classList.toggle('active', state.bombTargeting);
  bombButton.textContent = state.bombTargeting ? '選蔬菜' : `炸彈 ${bombUsesRemaining}/3`;
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
  return combo > 0 ? 1 + (combo + state.comboScoreBonus) * COMBO_SCORE_STEP : 1;
}

function scoreWithComboBonus(baseScore, combo) {
  const rawScore = baseScore * comboScoreMultiplier(combo) * pestComboScoreMultiplier() * (isGoldenTimeActive() ? 1.2 : 1);
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
    if (state.comboInsuranceCharges > 0) {
      state.comboInsuranceCharges -= 1;
      state.comboDuration = comboDurationFor(state.combo);
      state.comboExpiresAt = now + state.comboDuration;
      state.comboPulseStartedAt = now;
      state.comboPulseColor = '#35d7ff';
      pushComboInsuranceEffect('triggered', now);
      return;
    }
    state.combo = 0;
    state.comboDuration = 0;
    state.comboExpiresAt = 0;
    state.feverTimeTriggered = false;
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
  if (state.combo >= FEVER_COMBO_THRESHOLD && !state.feverTimeTriggered) {
    activateFeverTime(now);
  }
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

function pushComboInsuranceEffect(kind = 'ready', now = performance.now()) {
  if (comboInsuranceEffects.length >= 4) {
    comboInsuranceEffects.shift();
  }
  comboInsuranceEffects.push({
    kind,
    startedAt: now
  });
}

function activateFeverTime(now = performance.now()) {
  state.feverTimeTriggered = true;
  state.feverTimeStartedAt = now;
  state.feverTimeExpiresAt = now + FEVER_TIME_DURATION;
  state.comboPulseStartedAt = now;
  state.comboPulseColor = '#ff5bbd';
}

function isFeverTimeActive(now = performance.now()) {
  return now < state.feverTimeExpiresAt;
}
