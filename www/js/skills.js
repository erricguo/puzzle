const SKILL_CHOICES_PER_PICK = 3;
const TEMP_SKILL_DURATION = 5000;
const EXP_BASE_REQUIREMENT = 100;
const EXP_GROWTH_MULTIPLIER = 1.1;
const BLAST_RADIUS_MULTIPLIER = 2.15;
const BLAST_MIN_RADIUS = 48;
const BLAST_MAX_RADIUS = 150;
const BLAST_ANIMATION_DURATION = 520;
const FERTILIZER_ANIMATION_DURATION = 620;
const FERTILIZER_IMAGE_SRC = 'assets/images/fertilizer.png';
const PERMANENT_SKILL_MAX_STACKS = 5;
const SKILL_CHOICE_UNLOCK_DELAY = 1500;
const SKILL_CHOICE_LEVEL_INTERVAL = 10;
const LONG_TEMP_SKILL_DURATION = 15000;
const GOLDEN_TIME_DURATION = 20000;
const MERGE_SENSE_DURATION = 12000;
const MAGNET_MERGE_DURATION = 10000;
const DISABLED_SKILL_IDS = new Set(['fertilizer']);

const fertilizerImage = new Image();
fertilizerImage.src = FERTILIZER_IMAGE_SRC;

const SKILL_POOL = [
  {
    id: 'fast_fall',
    name: '急速降落',
    type: '限時',
    rarity: 'green',
    timerKey: 'fastFallExpiresAt',
    duration: TEMP_SKILL_DURATION,
    description: '5 秒內，蔬菜降下速度增加 50%，投放速度增加 30%。',
    apply: () => activateTimedSkill('fastFallExpiresAt')
  },
  {
    id: 'combo_freeze',
    name: 'Combo 凍結',
    type: '限時',
    rarity: 'blue',
    timerKey: 'comboFreezeExpiresAt',
    duration: TEMP_SKILL_DURATION,
    description: '5 秒內，Combo 時間不中斷。',
    apply: () => activateTimedSkill('comboFreezeExpiresAt')
  },
  {
    id: 'double_drop',
    name: '雙重投放',
    type: '限時',
    rarity: 'purple',
    timerKey: 'doubleDropExpiresAt',
    duration: TEMP_SKILL_DURATION,
    description: '5 秒內，一次可以丟兩顆蔬菜。',
    apply: () => activateTimedSkill('doubleDropExpiresAt')
  },
  {
    id: 'combo_score',
    name: 'Combo 強化',
    type: '永久',
    rarity: 'blue',
    description: 'COMBO 分數加成永久 +10%。',
    apply: () => {
      state.comboScoreBonus += 1;
    }
  },
  {
    id: 'drop_speed',
    name: '重力栽培',
    type: '永久',
    rarity: 'white',
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
    rarity: 'purple',
    description: '隨機炸裂三個蔬菜，附近蔬菜也會消失。',
    apply: blastRandomVegetables
  },
  {
    id: 'magnet_merge',
    name: '磁吸合成',
    type: '限時',
    rarity: 'gold',
    timerKey: 'magnetMergeExpiresAt',
    duration: MAGNET_MERGE_DURATION,
    description: '10 秒內，同等級蔬菜會微微互相靠近。',
    apply: () => activateTimedSkill('magnetMergeExpiresAt', MAGNET_MERGE_DURATION)
  },
  {
    id: 'clear_peas',
    name: '小菜清場',
    type: '立即',
    rarity: 'green',
    description: '立即清除場上所有 1 層蔬菜，並獲得少量分數。',
    apply: clearSmallVegetables
  },
  {
    id: 'precision_aim',
    name: '精準瞄準',
    type: '限時',
    rarity: 'green',
    timerKey: 'precisionAimExpiresAt',
    duration: LONG_TEMP_SKILL_DURATION,
    description: '15 秒內顯示落點輔助線，且掉落水平偏移降低。',
    apply: () => activateTimedSkill('precisionAimExpiresAt', LONG_TEMP_SKILL_DURATION)
  },
  {
    id: 'combo_insurance',
    name: 'Combo 保險',
    type: '一次',
    rarity: 'purple',
    description: '下一次 Combo 中斷時不歸零，保留目前 Combo 一次。',
    apply: activateComboInsurance
  },
  {
    id: 'random_upgrade',
    name: '蔬菜升級',
    type: '立即',
    rarity: 'blue',
    description: '隨機將 1 顆低階蔬菜升 1 級。',
    apply: upgradeRandomVegetable
  },
  {
    id: 'golden_time',
    name: '黃金時間',
    type: '限時',
    rarity: 'gold',
    timerKey: 'goldenTimeExpiresAt',
    duration: GOLDEN_TIME_DURATION,
    description: '20 秒內獲得分數 +20%。',
    apply: () => activateTimedSkill('goldenTimeExpiresAt', GOLDEN_TIME_DURATION)
  },
  {
    id: 'safety_cushion',
    name: '安全氣墊',
    type: '限時',
    rarity: 'blue',
    timerKey: 'safetyCushionExpiresAt',
    duration: LONG_TEMP_SKILL_DURATION,
    description: '15 秒內，危險線判定延遲 +1 秒。',
    apply: () => activateTimedSkill('safetyCushionExpiresAt', LONG_TEMP_SKILL_DURATION)
  },
  {
    id: 'lift_pulse',
    name: '重力反轉脈衝',
    type: '立即',
    rarity: 'purple',
    description: '立即給場上蔬菜一個小幅向上推力。',
    apply: applyLiftPulse
  },
  {
    id: 'merge_sense',
    name: '同色感應',
    type: '限時',
    rarity: 'gold',
    timerKey: 'mergeSenseExpiresAt',
    duration: MERGE_SENSE_DURATION,
    description: '12 秒內，同等級蔬菜靠近時更容易合成。',
    apply: () => activateTimedSkill('mergeSenseExpiresAt', MERGE_SENSE_DURATION)
  },
  {
    id: 'reroll_next',
    name: '下一顆重抽',
    type: '立即',
    rarity: 'white',
    description: '立即重抽下一顆蔬菜，且不高於 3 層。',
    apply: rerollNextVegetable
  },
  {
    id: 'fertilizer',
    name: '肥料',
    type: '道具',
    rarity: 'purple',
    description: '接下來 5 次投放改為肥料，被砸到的蔬菜會進階。',
    imageSrc: FERTILIZER_IMAGE_SRC,
    apply: activateFertilizerMode
  }
];

function expRequiredForLevel(level) {
  return Math.round(EXP_BASE_REQUIREMENT * Math.pow(EXP_GROWTH_MULTIPLIER, level - 1));
}

function gainExperience(amount) {
  if (!amount || state.gameOver) return;

  const startLevel = state.playerLevel;
  state.exp += amount;
  while (state.exp >= state.expToNext) {
    state.exp -= state.expToNext;
    state.playerLevel += 1;
    state.expToNext = expRequiredForLevel(state.playerLevel);
    if (state.playerLevel % SKILL_CHOICE_LEVEL_INTERVAL === 0) {
      state.pendingSkillChoices += 1;
    }
  }

  checkLevelEnvironmentEvents(startLevel, state.playerLevel);
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
  pauseEnvironmentEvents();
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

  updateDebugMergeButton();
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
    if (level % SKILL_CHOICE_LEVEL_INTERVAL === 0) {
      state.pendingSkillChoices += 1;
    }
  }

  state.playerLevel = toLevel;
  checkLevelEnvironmentEvents(fromLevel, toLevel);
  state.exp = 0;
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

function debugTriggerEnvironmentEvent(id) {
  if (!state.hasStarted || state.gameOver) return;

  triggerEnvironmentEvent(id);
  updateGravity();
  closeDebugPanel();
  updateHud();
}

function debugDropPumpkins(count = 10) {
  if (!state.hasStarted || state.gameOver) return;

  const level = VEGETABLES.length - 1;
  const radius = VEGETABLES[level].radius;
  const spacing = Math.max(radius * 0.62, 34);
  const startX = state.width / 2 - spacing * (count - 1) / 2;

  for (let index = 0; index < count; index++) {
    window.setTimeout(() => {
      if (!state.hasStarted || state.gameOver) return;
      const rowOffset = Math.floor(index / 5) * (radius * 0.35);
      const x = clamp(startX + spacing * index, radius + 8, state.width - radius - 8);
      const pumpkin = createVegetable(level, x, 72 - rowOffset);
      Body.setVelocity(pumpkin, {
        x: (Math.random() - 0.5) * 0.9,
        y: -0.4 + Math.random() * 0.4
      });
      Body.setAngularVelocity(pumpkin, (Math.random() - 0.5) * 0.18);
    }, index * 90);
  }

  closeDebugPanel();
}

function debugToggleMerge() {
  if (!state.hasStarted || state.gameOver) return;

  state.debugMergeDisabled = !state.debugMergeDisabled;
  updateDebugMergeButton();
}

function updateDebugMergeButton() {
  debugMergeToggleButton.textContent = state.debugMergeDisabled ? '允許合成' : '禁止合成';
  debugMergeToggleButton.classList.toggle('active', state.debugMergeDisabled);
}

function pickSkillOptions(skills) {
  const shuffled = [...skills].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, SKILL_CHOICES_PER_PICK);
}

function pickRefreshedSkillOptions(available) {
  if (!talentGuaranteesFreshSkillRefresh()) {
    return pickSkillOptions(available);
  }

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
    button.className = `skill-card rarity-${skill.rarity || 'white'}`;
    const maxStacks = maxStacksForSkill(skill);
    const stacks = Number.isFinite(maxStacks) ? skillPickCount(skill.id) : 0;
    const stackLabel = stacks ? ` ${stacks}/${maxStacks}` : '';
    button.innerHTML = `
      <small>${escapeHtml(rarityLabel(skill.rarity))} · ${escapeHtml(skill.type)}${stackLabel}</small>
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

function rarityLabel(rarity = 'white') {
  return ({
    white: '白',
    green: '綠',
    blue: '藍',
    purple: '紫',
    gold: '金'
  })[rarity] || '白';
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
  resumeEnvironmentEvents();
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

function activateTimedSkill(key, duration = TEMP_SKILL_DURATION) {
  const now = performance.now();
  const startedAt = Math.max(state[key] - duration, now);
  state[key] = Math.max(state[key], now) + duration;
  state.activeSkillTimers[key] = {
    startedAt,
    expiresAt: state[key],
    duration: state[key] - startedAt
  };
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
    state.doubleDropExpiresAt,
    state.magnetMergeExpiresAt,
    state.precisionAimExpiresAt,
    state.goldenTimeExpiresAt,
    state.safetyCushionExpiresAt,
    state.mergeSenseExpiresAt
  ].filter((expiresAt) => now < expiresAt).length;

  state.activeSkillLevel = activeCount;
  updateGravity(now);
  updateMagnetMerge(now);
  updateMergeSense(now);
  renderActiveSkillBars(now);
}

function timedSkillDefs() {
  return SKILL_POOL.filter((skill) => skill.timerKey);
}

function renderActiveSkillBars(now = performance.now()) {
  const activeSkills = timedSkillDefs()
    .map((skill) => {
      const expiresAt = state[skill.timerKey] || 0;
      const timer = state.activeSkillTimers[skill.timerKey] || {};
      const duration = timer.duration || skill.duration || TEMP_SKILL_DURATION;
      return {
        ...skill,
        expiresAt,
        duration,
        remaining: expiresAt - now
      };
    })
    .filter((skill) => skill.remaining > 0);

  activeSkillBarsEl.hidden = activeSkills.length === 0;
  activeSkillBarsEl.replaceChildren();

  activeSkills.forEach((skill) => {
    const item = document.createElement('div');
    item.className = `active-skill-bar rarity-${skill.rarity || 'white'}`;
    const progress = clamp(skill.remaining / skill.duration, 0, 1);
    item.innerHTML = `
      <span>${escapeHtml(skill.name)}</span>
      <b>${Math.ceil(skill.remaining / 1000)}s</b>
      <i style="width: ${progress * 100}%"></i>
    `;
    activeSkillBarsEl.appendChild(item);
  });
}

function isPrecisionAimActive(now = performance.now()) {
  return now < state.precisionAimExpiresAt;
}

function isGoldenTimeActive(now = performance.now()) {
  return now < state.goldenTimeExpiresAt;
}

function safetyCushionBonus(now = performance.now()) {
  return now < state.safetyCushionExpiresAt ? 1000 : 0;
}

function activateComboInsurance() {
  state.comboInsuranceCharges += 1;
  updateHud();
}

function clearSmallVegetables() {
  const toRemove = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && body.vegLevel === 0 && !body.isMerging && !body.isBlasting);
  if (!toRemove.length) return false;

  Composite.remove(world, toRemove);
  const scoreGain = scoreWithGoldenBonus(toRemove.length);
  state.score += scoreGain;
  recordDailyMissionProgress('blast', toRemove.length);
  recordDailyMissionProgress('score', scoreGain);
  updateHud();
}

function scoreWithGoldenBonus(amount) {
  const rawScore = amount * (isGoldenTimeActive() ? 1.2 : 1);
  const wholeScore = Math.floor(rawScore);
  state.scoreRemainder += rawScore - wholeScore;
  const carriedScore = Math.floor(state.scoreRemainder);
  state.scoreRemainder -= carriedScore;
  return wholeScore + carriedScore;
}

function upgradeRandomVegetable() {
  const candidates = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && !body.isMerging && !body.isBlasting && !body.isCorrupted && body.vegLevel < VEGETABLES.length - 1);
  if (!candidates.length) return false;

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  return applyFertilizerToVegetable(target, null);
}

function applyLiftPulse() {
  const bodies = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && !body.isMerging && !body.isBlasting);
  if (!bodies.length) return false;

  bodies.forEach((body) => {
    Body.setVelocity(body, {
      x: body.velocity.x * 0.72,
      y: Math.min(body.velocity.y - 3.2, -2.2)
    });
    Body.setAngularVelocity(body, body.angularVelocity * 0.6 + (Math.random() - 0.5) * 0.12);
    body.dangerEnteredAt = null;
  });
}

function rerollNextVegetable() {
  state.previewLevel = Math.floor(Math.random() * 3);
  setNextLevel();
  updateHud();
}

function updateMagnetMerge(now = performance.now()) {
  if (now >= state.magnetMergeExpiresAt) return;
  const bodies = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && !body.isMerging && !body.isBlasting && !body.isCorrupted);

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      if (a.vegLevel !== b.vegLevel) continue;
      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0 || distance > 150) continue;
      const force = 0.000018 * (1 - distance / 150);
      const fx = dx / distance * force;
      const fy = dy / distance * force;
      Body.applyForce(a, a.position, { x: fx * a.mass, y: fy * a.mass });
      Body.applyForce(b, b.position, { x: -fx * b.mass, y: -fy * b.mass });
    }
  }
}

function updateMergeSense(now = performance.now()) {
  if (now >= state.mergeSenseExpiresAt) return;
  const bodies = Composite.allBodies(world)
    .filter((body) => body.label === 'vegetable' && !body.isMerging && !body.isBlasting && !body.isCorrupted);

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      if (a.vegLevel !== b.vegLevel || a.vegLevel >= VEGETABLES.length - 1) continue;
      const mergeDistance = (VEGETABLES[a.vegLevel].radius + VEGETABLES[b.vegLevel].radius) * 1.18;
      if (Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) <= mergeDistance) {
        mergeVegetables(a, b);
        return;
      }
    }
  }
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

  const scoreGain = scoreWithGoldenBonus(toRemove.length);
  state.score += scoreGain;
  recordDailyMissionProgress('blast', toRemove.length);
  recordDailyMissionProgress('score', scoreGain);
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
  state.activeSkillTimers = {};
  state.selectedSkills = [];
  state.comboScoreBonus = 0;
  state.dropSpeedBonus = 0;
  state.fastFallExpiresAt = 0;
  state.comboFreezeExpiresAt = 0;
  state.comboFreezeLastAt = 0;
  state.doubleDropExpiresAt = 0;
  state.magnetMergeExpiresAt = 0;
  state.precisionAimExpiresAt = 0;
  state.goldenTimeExpiresAt = 0;
  state.safetyCushionExpiresAt = 0;
  state.mergeSenseExpiresAt = 0;
  state.fertilizerCharges = 0;
  state.activeSkillLevel = 0;
  state.comboInsuranceCharges = 0;
  blastEffects.length = 0;
  fertilizerEffects.length = 0;
  activeSkillBarsEl.hidden = true;
  activeSkillBarsEl.replaceChildren();
  skillPanel.hidden = true;
  skillCardsEl.replaceChildren();
  updateRefreshSkillButton();
  updateGravity();
}
