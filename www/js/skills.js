const SKILL_CHOICES_PER_PICK = 3;
const TEMP_SKILL_DURATION = 5000;
const EXP_BASE_REQUIREMENT = 12;
const EXP_GROWTH_PER_LEVEL = 4;
const BLAST_RADIUS_MULTIPLIER = 2.15;
const BLAST_MIN_RADIUS = 48;
const BLAST_MAX_RADIUS = 150;
const BLAST_ANIMATION_DURATION = 520;
const FERTILIZER_ANIMATION_DURATION = 620;
const FERTILIZER_IMAGE_SRC = 'assets/images/fertilizer.png';
const PERMANENT_SKILL_MAX_STACKS = 5;
const SKILL_CHOICE_UNLOCK_DELAY = 1500;
const DISABLED_SKILL_IDS = new Set(['fertilizer']);

const fertilizerImage = new Image();
fertilizerImage.src = FERTILIZER_IMAGE_SRC;

const SKILL_POOL = [
  {
    id: 'fast_fall',
    name: '急速降落',
    type: '限時',
    description: '5 秒內，蔬菜降下速度增加 50%，投放速度增加 30%。',
    apply: () => activateTimedSkill('fastFallExpiresAt')
  },
  {
    id: 'combo_freeze',
    name: 'Combo 凍結',
    type: '限時',
    description: '5 秒內，Combo 時間不中斷。',
    apply: () => activateTimedSkill('comboFreezeExpiresAt')
  },
  {
    id: 'double_drop',
    name: '雙重投放',
    type: '限時',
    description: '5 秒內，一次可以丟兩顆蔬菜。',
    apply: () => activateTimedSkill('doubleDropExpiresAt')
  },
  {
    id: 'combo_score',
    name: 'Combo 強化',
    type: '永久',
    description: 'COMBO 分數加成永久 +40%。',
    apply: () => {
      state.comboScoreBonus += 1;
    }
  },
  {
    id: 'drop_speed',
    name: '重力栽培',
    type: '永久',
    description: '蔬菜掉落速度永久 +10%。',
    apply: () => {
      state.dropSpeedBonus += 0.1;
      updateGravity();
    }
  },
  {
    id: 'blast_three',
    name: '蔬菜爆裂',
    type: '立即',
    description: '隨機炸裂三個蔬菜，附近蔬菜也會消失。',
    apply: blastRandomVegetables
  },
  {
    id: 'fertilizer',
    name: '肥料',
    type: '道具',
    description: '接下來 5 次投放改為肥料，被砸到的蔬菜會進階。',
    imageSrc: FERTILIZER_IMAGE_SRC,
    apply: activateFertilizerMode
  }
];

function expRequiredForLevel(level) {
  return EXP_BASE_REQUIREMENT + (level - 1) * EXP_GROWTH_PER_LEVEL;
}

function gainExperience(amount, combo = 0) {
  if (!amount || state.gameOver) return;

  state.exp += experienceWithComboBonus(amount, combo);
  while (state.exp >= state.expToNext) {
    state.exp -= state.expToNext;
    state.playerLevel += 1;
    state.expToNext = expRequiredForLevel(state.playerLevel);
    if (state.playerLevel % 5 === 0) {
      state.pendingSkillChoices += 1;
    }
  }

  updateHud();
  maybeShowSkillPanel();
}

function maybeShowSkillPanel() {
  if (state.pendingSkillChoices <= 0 || state.isChoosingSkill || state.gameOver) return;

  const available = availableSkills();
  if (!available.length) {
    state.pendingSkillChoices = 0;
    return;
  }

  state.pendingSkillChoices -= 1;
  state.isChoosingSkill = true;
  state.skillChoicesUnlockAt = performance.now() + SKILL_CHOICE_UNLOCK_DELAY;
  state.paused = true;
  cancelAiming();
  engine.timing.timeScale = 0;
  state.suppressDropUntil = performance.now() + 1000;
  pausePanel.hidden = true;
  pauseButton.textContent = '繼續';

  skillPanelKicker.textContent = `等級 ${state.playerLevel}`;
  state.skillRefreshesRemaining = 1 + talentSkillRefreshBonus();
  setSkillChoices(pickSkillOptions(available));
  updateRefreshSkillButton();
  skillPanel.hidden = false;
}

function showDebugPanel(event) {
  event?.preventDefault();
  if (!state.hasStarted || state.gameOver) return;

  debugPanel.hidden = !debugPanel.hidden;
}

function closeDebugPanel() {
  debugPanel.hidden = true;
}

function debugAddLevels(levels = 10) {
  if (!state.hasStarted || state.gameOver) return;

  const fromLevel = state.playerLevel;
  const toLevel = fromLevel + levels;
  for (let level = fromLevel + 1; level <= toLevel; level++) {
    if (level % 5 === 0) {
      state.pendingSkillChoices += 1;
    }
  }

  state.playerLevel = toLevel;
  state.exp = 0;
  state.expRemainder = 0;
  state.expToNext = expRequiredForLevel(state.playerLevel);
  updateHud();
  closeDebugPanel();
  maybeShowSkillPanel();
}

function debugUnlockCorruption() {
  if (!state.hasStarted || state.gameOver) return;

  state.debugCorruptionUnlocked = true;
  state.corruptionActive = true;
  state.corruptionLastAt = performance.now();
  closeDebugPanel();
  updateHud();
}

function pickSkillOptions(skills) {
  const shuffled = [...skills].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, SKILL_CHOICES_PER_PICK);
}

function pickRefreshedSkillOptions(available) {
  const currentIds = new Set(state.currentSkillChoiceIds);
  const alternates = available.filter((skill) => !currentIds.has(skill.id));
  if (!alternates.length) return pickSkillOptions(available);

  const guaranteedNew = pickSkillOptions(alternates).slice(0, 1);
  const remaining = available.filter((skill) => skill.id !== guaranteedNew[0].id);
  return [...guaranteedNew, ...pickSkillOptions(remaining).slice(0, SKILL_CHOICES_PER_PICK - 1)]
    .sort(() => Math.random() - 0.5);
}

function availableSkills() {
  return SKILL_POOL.filter((skill) => !isSkillDisabled(skill) && !isSkillMaxed(skill));
}

function isSkillDisabled(skill) {
  return DISABLED_SKILL_IDS.has(skill.id);
}

function isSkillMaxed(skill) {
  return skillPickCount(skill.id) >= maxStacksForSkill(skill);
}

function maxStacksForSkill(skill) {
  if (skill.maxStacks) return skill.maxStacks;
  return skill.type === '永久' ? PERMANENT_SKILL_MAX_STACKS : Infinity;
}

function skillPickCount(skillId) {
  return state.selectedSkills.filter((id) => id === skillId).length;
}

function setSkillChoices(skills) {
  state.currentSkillChoiceIds = skills.map((skill) => skill.id);
  renderSkillCards(skills);
}

function renderSkillCards(skills) {
  skillCardsEl.replaceChildren();
  const locked = performance.now() < state.skillChoicesUnlockAt;
  skillCardsEl.classList.toggle('skill-cards-waiting', locked);
  skills.forEach((skill) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'skill-card';
    const maxStacks = maxStacksForSkill(skill);
    const stacks = Number.isFinite(maxStacks) ? skillPickCount(skill.id) : 0;
    const stackLabel = stacks ? ` ${stacks}/${maxStacks}` : '';
    button.innerHTML = `
      <small>${escapeHtml(skill.type)}${stackLabel}</small>
      ${skill.imageSrc ? `<img src="${escapeHtml(skill.imageSrc)}" alt="" />` : ''}
      <strong>${escapeHtml(skill.name)}</strong>
      <span>${escapeHtml(skill.description)}</span>
    `;
    button.addEventListener('pointerdown', (event) => event.stopPropagation());
    button.addEventListener('pointerup', (event) => event.stopPropagation());
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      chooseSkill(skill.id);
    });
    skillCardsEl.appendChild(button);
  });

  if (locked) {
    window.setTimeout(updateSkillCardLockState, Math.max(0, state.skillChoicesUnlockAt - performance.now()));
  }
}

function updateSkillCardLockState() {
  const locked = performance.now() < state.skillChoicesUnlockAt;
  skillCardsEl.classList.toggle('skill-cards-waiting', locked);
}

function updateRefreshSkillButton() {
  const hasAlternateChoices = availableSkills().length > SKILL_CHOICES_PER_PICK;
  const canFreeRefresh = state.skillRefreshesRemaining > 0 && hasAlternateChoices;
  const canAdRefresh = state.skillRefreshesRemaining <= 0 && hasAlternateChoices && !state.skillRefreshAdBusy;
  refreshSkillButton.disabled = state.skillRefreshAdBusy || !hasAlternateChoices;
  refreshSkillButton.textContent = state.skillRefreshAdBusy
    ? '廣告準備中...'
    : state.skillRefreshesRemaining > 0 && !hasAlternateChoices
    ? '沒有可刷新卡片'
    : state.skillRefreshesRemaining > 0
      ? '刷新卡片'
      : '已刷新，看廣告再刷新';
  refreshSkillButton.classList.toggle('used', !canFreeRefresh);
  refreshSkillButton.classList.toggle('ad-ready', canAdRefresh);
}

function refreshSkillCards() {
  if (state.skillRefreshAdBusy) return;
  if (state.skillRefreshesRemaining <= 0) {
    requestSkillRefreshAd();
    return;
  }

  const available = availableSkills();
  if (available.length <= SKILL_CHOICES_PER_PICK) {
    state.skillRefreshesRemaining = 0;
    updateRefreshSkillButton();
    return;
  }

  state.skillRefreshesRemaining -= 1;
  state.skillChoicesUnlockAt = performance.now() + SKILL_CHOICE_UNLOCK_DELAY;
  setSkillChoices(pickRefreshedSkillOptions(available));
  updateRefreshSkillButton();
  playClickSound();
}

async function requestSkillRefreshAd() {
  const available = availableSkills();
  if (available.length <= SKILL_CHOICES_PER_PICK) {
    updateRefreshSkillButton();
    return;
  }

  state.skillRefreshAdBusy = true;
  updateRefreshSkillButton();

  try {
    const rewarded = await showRewardedSkillRefreshAd();
    if (rewarded) {
      state.skillRefreshesRemaining = 1;
    }
  } catch (error) {
    console.warn('廣告載入失敗', error);
    window.alert?.(`廣告目前無法顯示：${error?.message || '請稍後再試'}`);
  } finally {
    state.skillRefreshAdBusy = false;
    updateRefreshSkillButton();
  }
}

async function showRewardedSkillRefreshAd() {
  const adBridge = window.VeggieMergeAds?.showRewardedRefreshAd;
  if (typeof adBridge === 'function') {
    try {
      return await adBridge({ placement: 'skill_refresh' }) === true;
    } catch (error) {
      console.warn('技能刷新廣告播放失敗', error);
      return false;
    }
  }

  window.alert?.('廣告尚未設定：請接入 window.VeggieMergeAds.showRewardedRefreshAd()，並在完整看完廣告後回傳 true。');
  return false;
}

function chooseSkill(skillId) {
  if (performance.now() < state.skillChoicesUnlockAt) return;

  const skill = SKILL_POOL.find((item) => item.id === skillId);
  if (!skill || isSkillDisabled(skill) || isSkillMaxed(skill)) return;

  const applied = skill.apply();
  if (applied === false) return;
  state.selectedSkills.push(skillId);
  cancelAiming();
  state.suppressDropUntil = performance.now() + 320;
  state.skillRefreshesRemaining = 0;
  state.skillRefreshAdBusy = false;
  state.currentSkillChoiceIds = [];
  state.skillChoicesUnlockAt = 0;
  playClickSound();
  closeSkillPanel();
}

function closeSkillPanel() {
  skillPanel.hidden = true;
  state.isChoosingSkill = false;
  state.paused = false;
  cancelAiming();
  state.suppressDropUntil = performance.now() + 700;
  engine.timing.timeScale = 1;
  pauseButton.textContent = '暫停';
  updateHud();
  updateGravity();
  startMusic();
  maybeShowSkillPanel();
}

function cancelAiming() {
  if (state.pointerId !== null) {
    render.canvas.releasePointerCapture?.(state.pointerId);
  }
  state.aiming = false;
  state.pointerId = null;
}

function stopSkillPanelBackdropEvent(event) {
  if (!event.target.closest?.('.skill-card')) {
    event.stopPropagation();
  }
}

function activateTimedSkill(key) {
  const now = performance.now();
  state[key] = Math.max(state[key], now) + TEMP_SKILL_DURATION;
  updateGravity(now);
}

function isComboFrozen(now = performance.now()) {
  return now < state.comboFreezeExpiresAt;
}

function isDoubleDropActive(now = performance.now()) {
  return now < state.doubleDropExpiresAt;
}

function isFastFallActive(now = performance.now()) {
  return now < state.fastFallExpiresAt;
}

function dropCooldownFor(now = performance.now()) {
  const baseCooldown = 260;
  return isFastFallActive(now) ? baseCooldown * 0.7 : baseCooldown;
}

function updateGravity(now = performance.now()) {
  const temporaryBonus = isFastFallActive(now) ? 0.5 : 0;
  engine.gravity.y = BASE_GRAVITY_Y * (1 + state.dropSpeedBonus + temporaryBonus) * talentGravityMultiplier();
}

function updateActiveSkills(now = performance.now()) {
  const activeCount = [
    state.fastFallExpiresAt,
    state.comboFreezeExpiresAt,
    state.doubleDropExpiresAt
  ].filter((expiresAt) => now < expiresAt).length;

  state.activeSkillLevel = activeCount;
  updateGravity(now);
}

function blastRandomVegetables() {
  const now = performance.now();
  const bodies = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && !body.isMerging && !body.isBlasting && isBlastEligible(body, now));
  if (!bodies.length) return;

  const centers = pickWeightedBlastTargets(bodies, 3)
    .map((body) => ({
      x: body.position.x,
      y: body.position.y,
      radius: blastRadiusFor(body)
    }));

  const toRemove = bodies.filter((body) => centers.some((center) => (
    Math.hypot(body.position.x - center.x, body.position.y - center.y) <= center.radius
  )));

  toRemove.forEach((body) => {
    body.isBlasting = true;
    body.blastStartedAt = now;
    body.blastOrigin = nearestBlastCenter(body, centers);
    Body.setVelocity(body, {
      x: (body.position.x - body.blastOrigin.x) * 0.035,
      y: -3.8 + Math.random() * -1.4
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.45);
  });

  centers.forEach((center, index) => {
    blastEffects.push({
      x: center.x,
      y: center.y,
      startedAt: now + index * 45,
      radius: center.radius
    });
  });

  window.setTimeout(() => {
    const remaining = toRemove.filter((body) => Composite.allBodies(world).includes(body));
    Composite.remove(world, remaining);
  }, BLAST_ANIMATION_DURATION);

  state.score += toRemove.length;
  recordDailyMissionProgress('blast', toRemove.length);
  recordDailyMissionProgress('score', toRemove.length);
  updateHud();
}

function activateFertilizerMode() {
  state.fertilizerCharges += 5;
  state.aiming = false;
  state.pointerId = null;
  setNextLevel();
  updateHud();
}

function applyFertilizerToVegetable(target, fertilizer) {
  if (!target || target.isMerging || target.isBlasting || target.isCorrupted || target.vegLevel >= VEGETABLES.length - 1) return false;

  const nextLevel = target.vegLevel + 1;
  const position = { x: target.position.x, y: target.position.y };
  const velocity = { x: target.velocity.x, y: target.velocity.y };
  const angle = target.angle;
  const angularVelocity = target.angularVelocity;

  target.isMerging = true;
  Composite.remove(world, target);
  if (fertilizer) {
    consumeFertilizer(fertilizer);
  }

  const upgraded = createVegetable(nextLevel, position.x, position.y);
  upgraded.corruptionElapsed = 0;
  upgraded.corruptionProgress = 0;
  upgraded.isCorrupted = false;
  Body.setVelocity(upgraded, velocity);
  Body.setAngle(upgraded, angle);
  Body.setAngularVelocity(upgraded, angularVelocity + 0.18);

  const now = performance.now();
  fertilizerEffects.push({
    x: position.x,
    y: position.y,
    startedAt: now,
    level: nextLevel
  });
  playMergeSound(Math.max(1, state.combo), nextLevel);
  gainExperience(nextLevel + 1, state.combo);
  updateHud();
  return true;
}

function consumeFertilizer(fertilizer) {
  if (!fertilizer || fertilizer.isConsumed) return;

  fertilizer.isConsumed = true;
  Composite.remove(world, fertilizer);
  setNextLevel();
  updateHud();
}

function isBlastEligible(body, now = performance.now()) {
  return now >= body.canTriggerDangerAt;
}

function nearestBlastCenter(body, centers) {
  return centers.reduce((nearest, center) => {
    const currentDistance = Math.hypot(body.position.x - center.x, body.position.y - center.y);
    const nearestDistance = Math.hypot(body.position.x - nearest.x, body.position.y - nearest.y);
    return currentDistance < nearestDistance ? center : nearest;
  }, centers[0]);
}

function pickWeightedBlastTargets(bodies, count) {
  const pool = [...bodies];
  const picks = [];

  while (pool.length && picks.length < count) {
    const totalWeight = pool.reduce((sum, body) => sum + blastWeightFor(body), 0);
    let roll = Math.random() * totalWeight;
    const index = pool.findIndex((body) => {
      roll -= blastWeightFor(body);
      return roll <= 0;
    });
    picks.push(...pool.splice(index < 0 ? pool.length - 1 : index, 1));
  }

  return picks;
}

function blastWeightFor(body) {
  return VEGETABLES.length - body.vegLevel;
}

function blastRadiusFor(body) {
  const radius = VEGETABLES[body.vegLevel].radius * BLAST_RADIUS_MULTIPLIER;
  return clamp(radius, BLAST_MIN_RADIUS, BLAST_MAX_RADIUS);
}

function resetSkillState() {
  state.playerLevel = 1;
  state.exp = 0;
  state.expRemainder = 0;
  state.expToNext = expRequiredForLevel(1);
  state.corruptionActive = false;
  state.corruptionLastAt = 0;
  state.debugCorruptionUnlocked = false;
  state.pendingSkillChoices = 0;
  state.isChoosingSkill = false;
  state.skillRefreshesRemaining = 0;
  state.skillRefreshAdBusy = false;
  state.currentSkillChoiceIds = [];
  state.skillChoicesUnlockAt = 0;
  state.selectedSkills = [];
  state.comboScoreBonus = 0;
  state.dropSpeedBonus = 0;
  state.fastFallExpiresAt = 0;
  state.comboFreezeExpiresAt = 0;
  state.comboFreezeLastAt = 0;
  state.doubleDropExpiresAt = 0;
  state.fertilizerCharges = 0;
  state.activeSkillLevel = 0;
  blastEffects.length = 0;
  fertilizerEffects.length = 0;
  skillPanel.hidden = true;
  skillCardsEl.replaceChildren();
  updateRefreshSkillButton();
  updateGravity();
}
