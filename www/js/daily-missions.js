const DAILY_MISSION_COUNT = 3;
const DAILY_MISSION_AD_REFRESH_LIMIT = 1;
const DAILY_MISSION_DIFFICULTIES = ['easy', 'medium', 'hard'];

const DAILY_MISSION_RARITY_LABELS = {
  common: '普通',
  uncommon: '優良',
  rare: '稀有',
  epic: '史詩',
  legendary: '傳說'
};

const DAILY_MISSION_KIND_LABELS = {
  play: '對局',
  merge: '合成',
  score: '分數',
  combo: 'Combo',
  level: '層數',
  blast: '爆裂'
};

const DAILY_MISSION_DEFS = [
  {
    id: 'play_1',
    title: '今天也來一局',
    description: '今日完成 1 局遊戲。',
    target: 1,
    reward: 30,
    kind: 'play',
    mode: 'add',
    difficulty: 'easy',
    rarity: 'common'
  },
  {
    id: 'play_2',
    title: '再開一局',
    description: '今日完成 2 局遊戲。',
    target: 2,
    reward: 40,
    kind: 'play',
    mode: 'add',
    difficulty: 'easy',
    rarity: 'uncommon'
  },
  {
    id: 'merge_20',
    title: '合成練習',
    description: '今日合成 20 次蔬菜。',
    target: 20,
    reward: 50,
    kind: 'merge',
    mode: 'add',
    difficulty: 'easy',
    rarity: 'uncommon'
  },
  {
    id: 'merge_35',
    title: '順手合成',
    description: '今日合成 35 次蔬菜。',
    target: 35,
    reward: 60,
    kind: 'merge',
    mode: 'add',
    difficulty: 'easy',
    rarity: 'rare'
  },
  {
    id: 'blast_8',
    title: '小型清掃員',
    description: '今日用爆裂清掉 8 顆蔬菜。',
    target: 8,
    reward: 55,
    kind: 'blast',
    mode: 'add',
    difficulty: 'easy',
    rarity: 'uncommon'
  },
  {
    id: 'score_1200',
    title: '起步得分',
    description: '單局達到 1200 分。',
    target: 1200,
    reward: 60,
    kind: 'score',
    mode: 'max',
    difficulty: 'easy',
    rarity: 'common'
  },
  {
    id: 'score_1800',
    title: '穩定發揮',
    description: '單局達到 1800 分。',
    target: 1800,
    reward: 70,
    kind: 'score',
    mode: 'max',
    difficulty: 'easy',
    rarity: 'rare'
  },
  {
    id: 'combo_6',
    title: 'Combo 初階',
    description: '單局達成 Combo 6。',
    target: 6,
    reward: 60,
    kind: 'combo',
    mode: 'max',
    difficulty: 'easy',
    rarity: 'common'
  },
  {
    id: 'combo_10',
    title: 'Combo 成形',
    description: '單局達成 Combo 10。',
    target: 10,
    reward: 75,
    kind: 'combo',
    mode: 'max',
    difficulty: 'easy',
    rarity: 'uncommon'
  },
  {
    id: 'level_5',
    title: '小菜園成長',
    description: '今日合成到 5 層高級蔬菜。',
    target: 5,
    reward: 80,
    kind: 'level',
    mode: 'max',
    difficulty: 'easy',
    rarity: 'rare'
  },
  {
    id: 'play_3',
    title: '三局熱身',
    description: '今日完成 3 局遊戲。',
    target: 3,
    reward: 55,
    kind: 'play',
    mode: 'add',
    difficulty: 'medium',
    rarity: 'common'
  },
  {
    id: 'play_4',
    title: '再戰一回',
    description: '今日完成 4 局遊戲。',
    target: 4,
    reward: 65,
    kind: 'play',
    mode: 'add',
    difficulty: 'medium',
    rarity: 'uncommon'
  },
  {
    id: 'merge_50',
    title: '熟練合成',
    description: '今日合成 50 次蔬菜。',
    target: 50,
    reward: 90,
    kind: 'merge',
    mode: 'add',
    difficulty: 'medium',
    rarity: 'uncommon'
  },
  {
    id: 'merge_70',
    title: '連續整地',
    description: '今日合成 70 次蔬菜。',
    target: 70,
    reward: 110,
    kind: 'merge',
    mode: 'add',
    difficulty: 'medium',
    rarity: 'rare'
  },
  {
    id: 'blast_18',
    title: '中型清掃',
    description: '今日用爆裂清掉 18 顆蔬菜。',
    target: 18,
    reward: 95,
    kind: 'blast',
    mode: 'add',
    difficulty: 'medium',
    rarity: 'uncommon'
  },
  {
    id: 'blast_25',
    title: '爆裂熟手',
    description: '今日用爆裂清掉 25 顆蔬菜。',
    target: 25,
    reward: 110,
    kind: 'blast',
    mode: 'add',
    difficulty: 'medium',
    rarity: 'rare'
  },
  {
    id: 'score_3000',
    title: '菜園得分手',
    description: '單局達到 3000 分。',
    target: 3000,
    reward: 130,
    kind: 'score',
    mode: 'max',
    difficulty: 'medium',
    rarity: 'rare'
  },
  {
    id: 'score_4500',
    title: '得分節奏',
    description: '單局達到 4500 分。',
    target: 4500,
    reward: 150,
    kind: 'score',
    mode: 'max',
    difficulty: 'medium',
    rarity: 'epic'
  },
  {
    id: 'combo_20',
    title: 'Combo 小高手',
    description: '單局達成 Combo 20。',
    target: 20,
    reward: 140,
    kind: 'combo',
    mode: 'max',
    difficulty: 'medium',
    rarity: 'rare'
  },
  {
    id: 'level_8',
    title: '進階育成',
    description: '今日合成到 8 層高級蔬菜。',
    target: 8,
    reward: 160,
    kind: 'level',
    mode: 'max',
    difficulty: 'medium',
    rarity: 'epic'
  },
  {
    id: 'play_5',
    title: '五局耐力',
    description: '今日完成 5 局遊戲。',
    target: 5,
    reward: 80,
    kind: 'play',
    mode: 'add',
    difficulty: 'hard',
    rarity: 'uncommon'
  },
  {
    id: 'merge_90',
    title: '高強度合成',
    description: '今日合成 90 次蔬菜。',
    target: 90,
    reward: 170,
    kind: 'merge',
    mode: 'add',
    difficulty: 'hard',
    rarity: 'rare'
  },
  {
    id: 'merge_120',
    title: '爆量整地',
    description: '今日合成 120 次蔬菜。',
    target: 120,
    reward: 210,
    kind: 'merge',
    mode: 'add',
    difficulty: 'hard',
    rarity: 'epic'
  },
  {
    id: 'blast_40',
    title: '清場高手',
    description: '今日用爆裂清掉 40 顆蔬菜。',
    target: 40,
    reward: 180,
    kind: 'blast',
    mode: 'add',
    difficulty: 'hard',
    rarity: 'rare'
  },
  {
    id: 'blast_60',
    title: '爆裂專家',
    description: '今日用爆裂清掉 60 顆蔬菜。',
    target: 60,
    reward: 230,
    kind: 'blast',
    mode: 'add',
    difficulty: 'hard',
    rarity: 'epic'
  },
  {
    id: 'score_6000',
    title: '高分之路',
    description: '單局達到 6000 分。',
    target: 6000,
    reward: 240,
    kind: 'score',
    mode: 'max',
    difficulty: 'hard',
    rarity: 'epic'
  },
  {
    id: 'score_9000',
    title: '分數傳說',
    description: '單局達到 9000 分。',
    target: 9000,
    reward: 300,
    kind: 'score',
    mode: 'max',
    difficulty: 'hard',
    rarity: 'legendary'
  },
  {
    id: 'combo_35',
    title: 'Combo 名手',
    description: '單局達成 Combo 35。',
    target: 35,
    reward: 220,
    kind: 'combo',
    mode: 'max',
    difficulty: 'hard',
    rarity: 'epic'
  },
  {
    id: 'combo_50',
    title: 'Combo 傳說',
    description: '單局達成 Combo 50。',
    target: 50,
    reward: 320,
    kind: 'combo',
    mode: 'max',
    difficulty: 'hard',
    rarity: 'legendary'
  },
  {
    id: 'level_10',
    title: '高級蔬菜培育家',
    description: '今日合成到 10 層高級蔬菜。',
    target: 10,
    reward: 280,
    kind: 'level',
    mode: 'max',
    difficulty: 'hard',
    rarity: 'legendary'
  }
];

function dailyDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dailySeed(dateKey) {
  return [...dateKey].reduce((seed, char) => ((seed * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function pickDailyMissionIds(seedKey, excludedIds = []) {
  const excluded = new Set(excludedIds);
  const random = seededRandom(dailySeed(seedKey));
  const missionIds = DAILY_MISSION_DIFFICULTIES
    .map((difficulty) => {
      const available = DAILY_MISSION_DEFS.filter((mission) => (
        mission.difficulty === difficulty &&
        !excluded.has(mission.id)
      ));
      const pool = available.length
        ? available
        : DAILY_MISSION_DEFS.filter((mission) => mission.difficulty === difficulty);
      return [...pool].sort(() => random() - 0.5)[0]?.id;
    })
    .filter(Boolean);

  if (missionIds.length >= DAILY_MISSION_COUNT) return missionIds.slice(0, DAILY_MISSION_COUNT);

  return [...DAILY_MISSION_DEFS]
    .filter((mission) => !missionIds.includes(mission.id))
    .sort(() => random() - 0.5)
    .slice(0, DAILY_MISSION_COUNT - missionIds.length)
    .map((mission) => mission.id)
    .concat(missionIds);
}

function pickRefreshedDailyMissionIds(dateKey, currentIds) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const missionIds = pickDailyMissionIds(`${dateKey}:refresh:${attempt}`, currentIds);
    if (missionIds.some((id) => !currentIds.includes(id))) {
      return missionIds;
    }
  }
  return pickDailyMissionIds(`${dateKey}:refresh:fallback`);
}

function dailyMissionDef(id) {
  return DAILY_MISSION_DEFS.find((mission) => mission.id === id);
}

function normalizeDailyMissionState(stored = state.dailyMissionState) {
  const dateKey = dailyDateKey();
  const hasTodayMissionState = stored?.date === dateKey && Array.isArray(stored.missions);
  const storedMissions = hasTodayMissionState
    ? stored.missions
    : [];
  const storedById = new Map(storedMissions.map((mission) => [mission.id, mission]));
  let missionIds = hasTodayMissionState
    ? storedMissions.map((mission) => mission.id)
    : pickDailyMissionIds(dateKey);
  if (!missionIds.some((id) => dailyMissionDef(id))) {
    missionIds = pickDailyMissionIds(dateKey);
  }

  state.dailyMissionState = {
    date: dateKey,
    adRefreshUsed: stored?.date === dateKey && stored?.adRefreshUsed === true,
    missions: missionIds
      .map((id) => {
        const def = dailyMissionDef(id);
        if (!def) return null;
        const previous = storedById.get(id);
        const progress = clamp(Number(previous?.progress || 0), 0, def.target);
        return {
          id,
          progress,
          completed: progress >= def.target || previous?.completed === true,
          rewardClaimed: previous?.rewardClaimed === true
        };
      })
      .filter(Boolean)
  };

  saveDailyMissionState();
}

function saveCoins() {
  queuePlayerProgressSync?.();
}

function updateCoinUi() {
  if (coinBadgeEl) {
    const valueEl = coinBadgeEl.querySelector('b');
    if (valueEl) valueEl.textContent = String(state.coins);
  }
  if (dailyCoinWalletEl) {
    const valueEl = dailyCoinWalletEl.querySelector('b');
    if (valueEl) valueEl.textContent = String(state.coins);
  }
  if (talentCoinWalletEl) {
    const valueEl = talentCoinWalletEl.querySelector('b');
    if (valueEl) valueEl.textContent = String(state.coins);
  }
}

function addCoins(amount) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (!value) return;
  state.coins += value;
  saveCoins();
  updateCoinUi();
}

function spendCoins(amount) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (!value || state.coins < value) return false;
  state.coins -= value;
  saveCoins();
  updateCoinUi();
  return true;
}

function saveDailyMissionState() {
  queuePlayerProgressSync?.();
}

function setupDailyMissions() {
  normalizeDailyMissionState();
  updateCoinUi();
  renderDailyMissions();
  dailyMissionListEl?.addEventListener('click', (event) => {
    const claimButton = event.target.closest?.('.daily-claim-button');
    if (!claimButton || !dailyMissionListEl.contains(claimButton)) return;
    event.stopPropagation();
    claimDailyMissionReward(claimButton.dataset.missionId, claimButton);
    playClickSound();
  });
}

function resetDailyMissionProgress(missionIds) {
  return missionIds
    .map((id) => {
      const def = dailyMissionDef(id);
      if (!def) return null;
      return {
        id,
        progress: 0,
        completed: false,
        rewardClaimed: false
      };
    })
    .filter(Boolean);
}

function pulseDailyCoinWallet() {
  if (!dailyCoinWalletEl) return;
  dailyCoinWalletEl.classList.remove('coin-wallet-pop');
  dailyCoinWalletEl.offsetWidth;
  dailyCoinWalletEl.classList.add('coin-wallet-pop');
}

function showDailyRewardFeedback(message) {
  const panel = dailyScene?.querySelector?.('.daily-panel');
  if (!panel) return;
  panel.querySelector('.daily-reward-feedback')?.remove();
  const feedback = document.createElement('div');
  feedback.className = 'daily-reward-feedback';
  feedback.textContent = message;
  panel.appendChild(feedback);
  window.setTimeout(() => {
    feedback.remove();
  }, 520);
}

function claimDailyMissionReward(missionId, sourceButton = null) {
  normalizeDailyMissionState();
  const mission = state.dailyMissionState.missions.find((item) => item.id === missionId);
  const def = dailyMissionDef(missionId);
  if (!mission || !def || !mission.completed || mission.rewardClaimed) return;

  mission.rewardClaimed = true;
  const reward = dailyMissionReward(def);
  addCoins(reward);
  saveDailyMissionState();

  const missionEl = sourceButton?.closest?.('.daily-mission');
  if (!missionEl) {
    renderDailyMissions();
    pulseDailyCoinWallet();
    return;
  }

  sourceButton.disabled = true;
  sourceButton.textContent = '已領取';
  missionEl.classList.add('claiming');
  showDailyRewardFeedback(`獲得 ${reward} 金幣`);
  updateCoinUi();
  pulseDailyCoinWallet();

  window.setTimeout(() => {
    renderDailyMissions();
  }, 420);
}

function recordDailyMissionProgress(kind, amount = 1) {
  normalizeDailyMissionState();
  let changed = false;

  for (const mission of state.dailyMissionState.missions) {
    const def = dailyMissionDef(mission.id);
    if (!def || def.kind !== kind || mission.completed || mission.rewardClaimed) continue;

    const nextProgress = def.mode === 'max'
      ? Math.max(mission.progress, amount)
      : mission.progress + amount;
    mission.progress = clamp(nextProgress, 0, def.target);
    mission.completed = mission.progress >= def.target;
    changed = true;
  }

  if (!changed) return;
  saveDailyMissionState();
  if (dailyScene && !dailyScene.hidden) {
    renderDailyMissions();
  }
}

function dailyMissionReward(def) {
  return Math.ceil(def.reward * talentMissionRewardMultiplier());
}

function dailyMissionRarityLabel(def) {
  return DAILY_MISSION_RARITY_LABELS[def.rarity] || '普通';
}

function dailyMissionKindLabel(def) {
  return DAILY_MISSION_KIND_LABELS[def.kind] || '任務';
}

function updateDailyRefreshButton() {
  if (!dailyRefreshButton) return;
  normalizeDailyMissionState();
  const usedCount = state.dailyMissionState.adRefreshUsed ? DAILY_MISSION_AD_REFRESH_LIMIT : 0;
  const refreshAvailable = usedCount < DAILY_MISSION_AD_REFRESH_LIMIT;
  dailyRefreshButton.disabled = state.dailyMissionRefreshAdBusy || !refreshAvailable;
  dailyRefreshButton.textContent = state.dailyMissionRefreshAdBusy
    ? '廣告準備中...'
    : refreshAvailable
      ? '看廣告刷新任務'
      : '今日已刷新';
  dailyRefreshButton.classList.toggle('used', !refreshAvailable);
  dailyRefreshButton.classList.toggle('ad-ready', refreshAvailable && !state.dailyMissionRefreshAdBusy);
}

async function refreshDailyMissionsWithAd() {
  normalizeDailyMissionState();
  if (state.dailyMissionRefreshAdBusy || state.dailyMissionState.adRefreshUsed) {
    updateDailyRefreshButton();
    return;
  }

  state.dailyMissionRefreshAdBusy = true;
  updateDailyRefreshButton();

  try {
    const rewarded = await showRewardedDailyMissionRefreshAd();
    if (!rewarded) return;

    const currentIds = state.dailyMissionState.missions.map((mission) => mission.id);
    const addedMissions = resetDailyMissionProgress(
      pickRefreshedDailyMissionIds(state.dailyMissionState.date, currentIds)
    );
    state.dailyMissionState.missions.push(...addedMissions);
    state.dailyMissionState.adRefreshUsed = true;
    saveDailyMissionState();
    renderDailyMissions();
    playClickSound();
  } catch (error) {
    console.warn('每日任務刷新廣告播放失敗', error);
    window.alert?.(`廣告目前無法顯示：${error?.message || '請稍後再試'}`);
  } finally {
    state.dailyMissionRefreshAdBusy = false;
    updateDailyRefreshButton();
  }
}

async function showRewardedDailyMissionRefreshAd() {
  const adBridge = window.VeggieMergeAds?.showRewardedRefreshAd;
  if (typeof adBridge === 'function') {
    return await adBridge({ placement: 'daily_mission_refresh' }) === true;
  }

  window.alert?.('廣告尚未設定：請接入 window.VeggieMergeAds.showRewardedRefreshAd()，並在完整看完廣告後回傳 true。');
  return false;
}

function renderDailyMissions() {
  normalizeDailyMissionState();
  updateCoinUi();
  updateDailyRefreshButton();
  const completedCount = state.dailyMissionState.missions.filter((mission) => mission.completed).length;
  dailySummaryEl.textContent = `今日任務 ${completedCount}/${state.dailyMissionState.missions.length}`;
  dailyResetTextEl.textContent = `每日 00:00 更新 · ${state.dailyMissionState.date}`;
  dailyMissionListEl.replaceChildren();

  if (!state.dailyMissionState.missions.length) {
    const emptyItem = document.createElement('article');
    emptyItem.className = 'daily-mission daily-mission-empty';
    emptyItem.innerHTML = `
      <div class="daily-mission-copy">
        <div class="daily-mission-tags">
          <small class="daily-tag daily-rarity">無任務</small>
        </div>
        <strong>今天沒有任務</strong>
        <span>明天會重新補上新任務，也可以用刷新補一輪。</span>
        <em><img src="assets/images/coin.png" alt="" /> 先休息一下</em>
      </div>
    `;
    dailyMissionListEl.appendChild(emptyItem);
    return;
  }

  for (const mission of state.dailyMissionState.missions) {
    const def = dailyMissionDef(mission.id);
    if (!def) continue;

    const progress = clamp(mission.progress, 0, def.target);
    const percent = clamp((progress / def.target) * 100, 0, 100);
    const reward = dailyMissionReward(def);
    const item = document.createElement('article');
    item.className = `daily-mission daily-mission-${def.difficulty || 'easy'} daily-rarity-${def.rarity || 'common'} daily-kind-${def.kind || 'mission'}${mission.completed ? ' completed' : ''}`;
    item.innerHTML = `
      <em class="daily-reward-pill"><img src="assets/images/coin.png" alt="" /> ${reward}</em>
      <div class="daily-mission-copy">
        <div class="daily-mission-tags">
          <small class="daily-tag daily-kind">${escapeHtml(dailyMissionKindLabel(def))}</small>
          <small class="daily-tag daily-rarity">${escapeHtml(dailyMissionRarityLabel(def))}</small>
        </div>
        <strong>${escapeHtml(def.title)}</strong>
        <span>${escapeHtml(def.description)}</span>
      </div>
      <div class="daily-progress">
        <div class="daily-progress-row">
          <small>${Math.floor(progress)}/${def.target}</small>
          <b>${mission.completed ? (mission.rewardClaimed ? '已獲得' : '可領取') : '進行中'}</b>
        </div>
        <div class="daily-progress-track">
          <i style="width: ${percent}%"></i>
        </div>
      </div>
      ${mission.completed && !mission.rewardClaimed
        ? `<button class="daily-claim-button" type="button" data-mission-id="${escapeHtml(mission.id)}"><img src="assets/images/coin.png" alt="" /> 領取 ${reward}</button>`
        : ''}
    `;
    dailyMissionListEl.appendChild(item);
  }
}

function openDailyMissions() {
  renderDailyMissions();
  dailyScene.hidden = false;
}

function closeDailyMissions() {
  dailyScene.hidden = true;
}
