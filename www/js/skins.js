const SKIN_STORAGE_KEY = 'veggieMergeSelectedSkin';

const SKIN_DEFS = [
  {
    id: 'garden',
    name: '田園晨光',
    summary: '清爽綠色主題，適合原本的蔬菜合成感。',
    effect: '經典',
    swatches: ['#f7fbef', '#75c85a', '#ffd84d']
  },
  {
    id: 'sunset',
    name: '夕陽農場',
    summary: '溫暖橘紅色調，主遊戲畫面更有收成感。',
    effect: '暖色',
    swatches: ['#fff3d1', '#ff9f43', '#d95732']
  },
  {
    id: 'midnight',
    name: '夜市霓虹',
    summary: '深色霓虹風格，讓蔬菜和 Combo 更醒目。',
    effect: '霓虹',
    swatches: ['#172033', '#27d7c8', '#f55b98']
  },
  {
    id: 'frost',
    name: '冰霜溫室',
    summary: '冷色玻璃溫室風，畫面明亮又乾淨。',
    effect: '冰藍',
    swatches: ['#eefaff', '#64c7e8', '#8fdc9b']
  }
];

function normalizeSkinId(id) {
  return SKIN_DEFS.some((skin) => skin.id === id) ? id : 'garden';
}

function loadSelectedSkin() {
  return normalizeSkinId(localStorage.getItem(SKIN_STORAGE_KEY));
}

function saveSelectedSkin(id) {
  const skinId = normalizeSkinId(id);
  localStorage.setItem(SKIN_STORAGE_KEY, skinId);
  return skinId;
}

function applySelectedSkin(id = 'garden', options = {}) {
  if (typeof state !== 'undefined' && !id) {
    id = state.selectedSkin || 'garden';
  }
  const skinId = normalizeSkinId(id);
  document.body.classList.remove(...SKIN_DEFS.map((skin) => `skin-${skin.id}`));
  document.body.classList.add(`skin-${skinId}`);
  if (typeof state !== 'undefined') {
    state.selectedSkin = skinId;
  }
  saveSelectedSkin(skinId);
  if (options.persist !== false) {
    queuePlayerProgressSync?.();
  }
  return skinId;
}

function renderSkinShop() {
  if (!skinListEl) return;
  talentSummaryEl.textContent = '選擇主遊戲畫面皮膚';
  skinListEl.replaceChildren();

  for (const skin of SKIN_DEFS) {
    const active = normalizeSkinId(state.selectedSkin) === skin.id;
    const card = document.createElement('article');
    card.className = `talent-card skin-card${active ? ' owned' : ''}`;
    card.innerHTML = `
      <div class="skin-preview" aria-hidden="true">
        ${skin.swatches.map((color) => `<span style="--skin-color: ${escapeHtml(color)}"></span>`).join('')}
      </div>
      <div class="talent-copy">
        <small>${escapeHtml(skin.effect)}</small>
        <strong>${escapeHtml(skin.name)}</strong>
        <span>${escapeHtml(skin.summary)}</span>
      </div>
      <button class="talent-buy-button skin-apply-button" type="button" ${active ? 'disabled' : ''} data-skin-id="${escapeHtml(skin.id)}">
        ${active ? '套用中' : '套用'}
      </button>
    `;
    card.querySelector('.skin-apply-button')?.addEventListener('click', (event) => {
      event.stopPropagation();
      applySelectedSkin(event.currentTarget.dataset.skinId);
      showShopPurchaseFeedback(`套用 ${skin.name}`);
      renderSkinShop();
      playClickSound();
    });
    skinListEl.appendChild(card);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  applySelectedSkin(typeof state !== 'undefined' ? state.selectedSkin : loadSelectedSkin(), { persist: false });
});
