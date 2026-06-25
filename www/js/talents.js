const TALENT_STORAGE_KEY = 'veggieMergeOwnedTalents';
let activeShopTab = 'talent';

const TALENT_DEFS = [
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
  },
  {
    id: 'stable_preview',
    name: '穩定預告',
    cost: 2000,
    summary: '額外顯示再下一顆蔬菜，提前安排堆疊路線。',
    effect: '預告 +1'
  },
  {
    id: 'precision_drop',
    name: '精準投放',
    cost: 500,
    summary: '蔬菜掉落時的水平隨機速度降低 20%。',
    effect: '水平偏移 -20%'
  },
  {
    id: 'basket_expand',
    name: '菜籃擴容',
    cost: 5000,
    summary: '蔬菜碰到危險線後，多 0.4 秒才會結束遊戲。',
    effect: '危險線 +0.4 秒'
  },
  {
    id: 'mission_expert',
    name: '任務達人',
    cost: 5000,
    summary: '每日任務金幣獎勵增加 10%。',
    effect: '任務獎勵 +10%'
  },
  {
    id: 'inspiration_pity',
    name: '靈感保底',
    cost: 1000,
    summary: '刷新技能卡時，至少出現 1 張本輪未看過的技能。',
    effect: '刷新保底'
  }
];

const ITEM_SHOP_DEFS = [
  {
    id: 'bomb',
    name: '炸彈',
    cost: 50,
    quantity: 1,
    summary: '遊戲中使用，選擇一顆蔬菜引爆，炸裂自己和周圍蔬菜。',
    effect: '指定範圍爆破'
  },
  {
    id: 'revive_ticket',
    name: '復活券',
    cost: 500,
    quantity: 1,
    summary: '遊戲結束時可使用，炸掉最上方 30 顆蔬菜並繼續本局。',
    effect: '持有可疊加'
  }
];

function saveOwnedTalents() {
  localStorage.setItem(TALENT_STORAGE_KEY, JSON.stringify(state.ownedTalents));
  queuePlayerProgressSync?.();
}

function hasTalent(id) {
  return state.ownedTalents.includes(id);
}

function ownedVisibleTalentCount() {
  const visibleTalentIds = new Set(TALENT_DEFS.map((talent) => talent.id));
  return state.ownedTalents.filter((id) => visibleTalentIds.has(id)).length;
}

function buyTalent(id, sourceButton = null) {
  const talent = TALENT_DEFS.find((item) => item.id === id);
  if (!talent || hasTalent(id)) return;
  if (!spendCoins(talent.cost)) {
    talentSummaryEl.textContent = '金幣不足';
    return;
  }

  state.ownedTalents = [...state.ownedTalents, id];
  saveOwnedTalents();
  const card = sourceButton?.closest?.('.talent-card');
  if (card) {
    sourceButton.disabled = true;
    card.classList.add('purchased');
    showShopPurchaseFeedback(`啟用 ${talent.name}`);
    updateCoinUi();
    pulseTalentCoinWallet();
    talentSummaryEl.textContent = `已擁有 ${ownedVisibleTalentCount()}/${TALENT_DEFS.length}`;
    window.setTimeout(() => {
      renderTalentShop();
    }, 420);
  } else {
    renderTalentShop();
    pulseTalentCoinWallet();
  }
  playClickSound();
}

function pulseTalentCoinWallet() {
  if (!talentCoinWalletEl) return;
  talentCoinWalletEl.classList.remove('coin-wallet-pop');
  talentCoinWalletEl.offsetWidth;
  talentCoinWalletEl.classList.add('coin-wallet-pop');
}

function showShopPurchaseFeedback(message) {
  const panel = talentScene?.querySelector?.('.talent-panel');
  if (!panel) return;
  panel.querySelector('.shop-purchase-feedback')?.remove();
  const feedback = document.createElement('div');
  feedback.className = 'shop-purchase-feedback';
  feedback.textContent = message;
  panel.appendChild(feedback);
  window.setTimeout(() => {
    feedback.remove();
  }, 520);
}

function buyShopItem(id, sourceButton = null) {
  const item = ITEM_SHOP_DEFS.find((entry) => entry.id === id);
  if (!item) return;
  if (!spendCoins(item.cost)) {
    talentSummaryEl.textContent = '金幣不足';
    return;
  }

  if (item.id === 'revive_ticket') {
    addReviveTickets(item.quantity);
  }
  if (item.id === 'bomb') {
    addBombs(item.quantity);
  }

  const card = sourceButton?.closest?.('.talent-card');
  if (card) {
    sourceButton.disabled = true;
    card.classList.add('purchased');
    showShopPurchaseFeedback(`獲得 ${item.name} x${item.quantity || 1}`);
    updateCoinUi();
    pulseTalentCoinWallet();
    talentSummaryEl.textContent = itemShopSummary();
    window.setTimeout(() => {
      renderItemShop();
    }, 420);
  } else {
    renderItemShop();
    pulseTalentCoinWallet();
  }

  playClickSound();
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

function talentHasStablePreview() {
  return hasTalent('stable_preview');
}

function talentDropVelocityMultiplier() {
  return hasTalent('precision_drop') ? 0.8 : 1;
}

function talentDangerDelayBonus() {
  return hasTalent('basket_expand') ? 400 : 0;
}

function talentMissionRewardMultiplier() {
  return hasTalent('mission_expert') ? 1.1 : 1;
}

function talentGuaranteesFreshSkillRefresh() {
  return hasTalent('inspiration_pity');
}

function applyStartTalents() {
  if (hasTalent('quick_level')) {
    state.playerLevel = Math.max(state.playerLevel, 3);
    state.exp = 0;
    state.expToNext = expRequiredForLevel(state.playerLevel);
  }

  updateGravity();
  updateHud();
}

function renderTalentShop() {
  updateCoinUi();
  talentSummaryEl.textContent = `已擁有 ${ownedVisibleTalentCount()}/${TALENT_DEFS.length}`;
  talentListEl.replaceChildren();

  const sortedTalents = [...TALENT_DEFS]
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

  for (const talent of sortedTalents) {
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
      buyTalent(event.currentTarget.dataset.talentId, event.currentTarget);
    });
    talentListEl.appendChild(item);
  }
}

function renderItemShop() {
  updateCoinUi();
  talentSummaryEl.textContent = itemShopSummary();
  itemListEl.replaceChildren();

  const sortedItems = [...ITEM_SHOP_DEFS]
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

  for (const item of sortedItems) {
    const affordable = state.coins >= item.cost;
    const card = document.createElement('article');
    card.className = 'talent-card item-card';
    card.innerHTML = `
      <div class="talent-copy">
        <small>${escapeHtml(item.effect)}</small>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.summary)}</span>
      </div>
      <button class="talent-buy-button" type="button" ${!affordable ? 'disabled' : ''} data-item-id="${escapeHtml(item.id)}">
        <img src="assets/images/coin.png" alt="" /> ${item.cost}
      </button>
    `;
    card.querySelector('.talent-buy-button')?.addEventListener('click', (event) => {
      event.stopPropagation();
      buyShopItem(event.currentTarget.dataset.itemId, event.currentTarget);
    });
    itemListEl.appendChild(card);
  }
}

function itemShopSummary() {
  return `復活券 ${state.reviveTickets} 張 · 炸彈 ${state.bombs} 顆`;
}

function setShopTab(tab = activeShopTab) {
  activeShopTab = tab === 'item' ? 'item' : 'talent';
  const isTalentTab = activeShopTab === 'talent';
  talentShopTabButton.classList.toggle('active', isTalentTab);
  itemShopTabButton.classList.toggle('active', !isTalentTab);
  talentListEl.hidden = !isTalentTab;
  itemListEl.hidden = isTalentTab;
  document.querySelector('.talent-note').textContent = isTalentTab
    ? '已購買的天賦會在每局開始時自動生效。'
    : '道具會存入背包，遊戲中符合條件時即可使用。';

  if (isTalentTab) {
    renderTalentShop();
  } else {
    renderItemShop();
  }
}

function openTalentShop() {
  setShopTab(activeShopTab);
  talentScene.hidden = false;
}

function closeTalentShop() {
  talentScene.hidden = true;
}
