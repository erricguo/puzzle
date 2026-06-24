const DAILY_MISSION_STORAGE_KEY = 'veggieMergeDailyMissions';
const DAILY_MISSION_COUNT = 3;

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

function pickDailyMissionIds(dateKey) {
  const random = seededRandom(dailySeed(dateKey));
  return [...DAILY_MISSION_DEFS]
    .sort(() => random() - 0.5)
    .slice(0, DAILY_MISSION_COUNT)
    .map((mission) => mission.id);
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
      .slice(0, DAILY_MISSION_COUNT)
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

function claimDailyMissionReward(missionId) {
  normalizeDailyMissionState();
  const mission = state.dailyMissionState.missions.find((item) => item.id === missionId);
  const def = dailyMissionDef(missionId);
  if (!mission || !def || !mission.completed || mission.rewardClaimed) return;

  mission.rewardClaimed = true;
  addCoins(def.reward);
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
    const justCompleted = !mission.completed && mission.progress >= def.target;
    mission.completed = mission.progress >= def.target;
    if (justCompleted && !mission.rewardClaimed) {
      mission.rewardClaimed = true;
      addCoins(def.reward);
    }
    changed = true;
  }

  if (!changed) return;
  saveDailyMissionState();
  if (dailyScene && !dailyScene.hidden) {
    renderDailyMissions();
  }
}

function renderDailyMissions() {
  normalizeDailyMissionState();
  updateCoinUi();
  const completedCount = state.dailyMissionState.missions.filter((mission) => mission.completed).length;
  dailySummaryEl.textContent = `今日任務 ${completedCount}/${state.dailyMissionState.missions.length}`;
  dailyResetTextEl.textContent = `每日 00:00 更新 · ${state.dailyMissionState.date}`;
  dailyMissionListEl.replaceChildren();

  for (const mission of state.dailyMissionState.missions) {
    const def = dailyMissionDef(mission.id);
    if (!def) continue;

    const progress = clamp(mission.progress, 0, def.target);
    const percent = clamp((progress / def.target) * 100, 0, 100);
    const item = document.createElement('article');
    item.className = `daily-mission${mission.completed ? ' completed' : ''}`;
    item.innerHTML = `
      <div class="daily-mission-copy">
        <strong>${escapeHtml(def.title)}</strong>
        <span>${escapeHtml(def.description)}</span>
        <em><img src="assets/images/coin.png" alt="" /> 獎勵 ${def.reward}</em>
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
        ? `<button class="daily-claim-button" type="button" data-mission-id="${escapeHtml(mission.id)}"><img src="assets/images/coin.png" alt="" /> 領取 ${def.reward}</button>`
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
