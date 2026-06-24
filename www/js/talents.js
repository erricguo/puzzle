const TALENT_STORAGE_KEY = 'veggieMergeOwnedTalents';

const TALENT_DEFS = [
  {
    id: 'starter_score',
    name: '開局紅利',
    cost: 120,
    summary: '每局開始時直接獲得 100 分。',
    effect: '開局 +100 分'
  },
  {
    id: 'quick_level',
    name: '早熟菜苗',
    cost: 180,
    summary: '每局從 Lv 3 開始，更快拿到第一張技能卡。',
    effect: '開局 Lv 3'
  },
  {
    id: 'combo_memory',
    name: 'Combo 餘韻',
    cost: 240,
    summary: 'Combo 條額外延長 0.25 秒。',
    effect: 'Combo +0.25 秒'
  },
  {
    id: 'gentle_drop',
    name: '穩定投放',
    cost: 220,
    summary: '蔬菜下落速度略微放慢，比較容易堆疊。',
    effect: '重力 -8%'
  },
  {
    id: 'extra_refresh',
    name: '靈感備份',
    cost: 300,
    summary: '每次技能選擇多 1 次免費刷新。',
    effect: '技能刷新 +1'
  }
];

function saveOwnedTalents() {
  localStorage.setItem(TALENT_STORAGE_KEY, JSON.stringify(state.ownedTalents));
  queuePlayerProgressSync?.();
}

function hasTalent(id) {
  return state.ownedTalents.includes(id);
}

function buyTalent(id) {
  const talent = TALENT_DEFS.find((item) => item.id === id);
  if (!talent || hasTalent(id)) return;
  if (!spendCoins(talent.cost)) {
    talentSummaryEl.textContent = '金幣不足';
    return;
  }

  state.ownedTalents = [...state.ownedTalents, id];
  saveOwnedTalents();
  playClickSound();
  renderTalentShop();
}

function talentComboDurationBonus() {
  return hasTalent('combo_memory') ? 250 : 0;
}

function talentGravityMultiplier() {
  return hasTalent('gentle_drop') ? 0.92 : 1;
}

function talentSkillRefreshBonus() {
  return hasTalent('extra_refresh') ? 1 : 0;
}

function applyStartTalents() {
  if (hasTalent('quick_level')) {
    state.playerLevel = Math.max(state.playerLevel, 3);
    state.exp = 0;
    state.expToNext = expRequiredForLevel(state.playerLevel);
  }

  if (hasTalent('starter_score')) {
    state.score += 100;
  }

  updateGravity();
  updateHud();
}

function renderTalentShop() {
  updateCoinUi();
  talentSummaryEl.textContent = `已擁有 ${state.ownedTalents.length}/${TALENT_DEFS.length}`;
  talentListEl.replaceChildren();

  for (const talent of TALENT_DEFS) {
    const owned = hasTalent(talent.id);
    const affordable = state.coins >= talent.cost;
    const item = document.createElement('article');
    item.className = `talent-card${owned ? ' owned' : ''}`;
    item.innerHTML = `
      <div class="talent-copy">
        <small>${escapeHtml(talent.effect)}</small>
        <strong>${escapeHtml(talent.name)}</strong>
        <span>${escapeHtml(talent.summary)}</span>
      </div>
      <button class="talent-buy-button" type="button" ${owned || !affordable ? 'disabled' : ''} data-talent-id="${escapeHtml(talent.id)}">
        ${owned
          ? '已擁有'
          : `<img src="assets/images/coin.png" alt="" /> ${talent.cost}`}
      </button>
    `;
    item.querySelector('.talent-buy-button')?.addEventListener('click', (event) => {
      event.stopPropagation();
      buyTalent(event.currentTarget.dataset.talentId);
    });
    talentListEl.appendChild(item);
  }
}

function openTalentShop() {
  renderTalentShop();
  talentScene.hidden = false;
}

function closeTalentShop() {
  talentScene.hidden = true;
}
