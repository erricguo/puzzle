const DAILY_MISSION_STORAGE_KEY = 'veggieMergeDailyMissions';
const DAILY_MISSION_COUNT = 3;
const DAILY_MISSION_AD_REFRESH_LIMIT = 1;

const DAILY_MISSION_DEFS = [
  {
    id: 'score_1000',
    title: '菜園得分手',
    description: '今日累積獲得 1000 分。',
    target: 1000,
    reward: 60,
    kind: 'score',
    mode: 'add'
  },
  {
    id: 'merge_30',
    title: '合成練習',
    description: '今日合成 30 次蔬菜。',
    target: 30,
    reward: 40,
    kind: 'merge',
    mode: 'add'
  },
  {
    id: 'combo_8',
    title: 'Combo 小高手',
    description: '今日達成最高 Combo 8。',
    target: 8,
    reward: 80,
    kind: 'combo',
    mode: 'max'
  },
  {
    id: 'blast_10',
    title: '腐化清道夫',
    description: '今日用爆裂清掉 10 顆蔬菜。',
    target: 10,
    reward: 70,
    kind: 'blast',
    mode: 'add'
  },
  {
    id: 'level_7',
    title: '高層農夫',
    description: '今日合成到 7 層蔬菜。',
    target: 7,
    reward: 80,
    kind: 'level',
    mode: 'max'
  },
  {
    id: 'play_1',
    title: '今天也來一局',
    description: '今日完成 1 局遊戲。',
    target: 1,
    reward: 20,
    kind: 'play',
    mode: 'add'
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
  const available = DAILY_MISSION_DEFS.filter((mission) => !excluded.has(mission.id));
  const pool = available.length >= DAILY_MISSION_COUNT ? available : DAILY_MISSION_DEFS;
  const random = seededRandom(dailySeed(seedKey));
  return [...pool]
    .sort(() => random() - 0.5)
    .slice(0, DAILY_MISSION_COUNT)
    .map((mission) => mission.id);
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
  const storedMissions = stored?.date === dateKey && Array.isArray(stored.missions)
    ? stored.missions
    : [];
  const storedById = new Map(storedMissions.map((mission) => [mission.id, mission]));
  const missionIds = stored?.date === dateKey && storedMissions.length
    ? storedMissions.map((mission) => mission.id)
    : pickDailyMissionIds(dateKey);

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
      .filter((mission) => !mission.rewardClaimed)
  };

  saveDailyMissionState();
}

function saveCoins() {
  localStorage.setItem('veggieMergeCoins', String(state.coins));
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
  localStorage.setItem(DAILY_MISSION_STORAGE_KEY, JSON.stringify(state.dailyMissionState));
}

function setupDailyMissions() {
  normalizeDailyMissionState();
  updateCoinUi();
  renderDailyMissions();
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

function claimDailyMissionReward(missionId) {
  normalizeDailyMissionState();
  const mission = state.dailyMissionState.missions.find((item) => item.id === missionId);
  const def = dailyMissionDef(missionId);
  if (!mission || !def || !mission.completed || mission.rewardClaimed) return;

  mission.rewardClaimed = true;
  addCoins(dailyMissionReward(def));
  state.dailyMissionState.missions = state.dailyMissionState.missions.filter((item) => item.id !== missionId);
  saveDailyMissionState();
  renderDailyMissions();
}

function recordDailyMissionProgress(kind, amount = 1) {
  normalizeDailyMissionState();
  let changed = false;

  for (const mission of state.dailyMissionState.missions) {
    const def = dailyMissionDef(mission.id);
    if (!def || def.kind !== kind || mission.completed) continue;

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

  for (const mission of state.dailyMissionState.missions) {
    const def = dailyMissionDef(mission.id);
    if (!def) continue;

    const progress = clamp(mission.progress, 0, def.target);
    const percent = clamp((progress / def.target) * 100, 0, 100);
    const reward = dailyMissionReward(def);
    const item = document.createElement('article');
    item.className = `daily-mission${mission.completed ? ' completed' : ''}`;
    item.innerHTML = `
      <div class="daily-mission-copy">
        <strong>${escapeHtml(def.title)}</strong>
        <span>${escapeHtml(def.description)}</span>
        <em><img src="assets/images/coin.png" alt="" /> 獎勵 ${reward}</em>
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
    item.querySelector('.daily-claim-button')?.addEventListener('click', (event) => {
      event.stopPropagation();
      claimDailyMissionReward(event.currentTarget.dataset.missionId);
      playClickSound();
    });
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
