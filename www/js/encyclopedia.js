const ENCYCLOPEDIA_STORAGE_KEY = 'veggieMergeEncyclopediaLevels';
const ENCYCLOPEDIA_TABLE = 'vegetable_encyclopedia_unlocks';
const VEGETABLE_DESCRIPTIONS = [
  '小小一顆，總是第一個跳進籃子裡。',
  '脾氣直直的，落下來也很有精神。',
  '外表溫柔，心裡藏著一圈圈小宇宙。',
  '紅通通的開心果，最會把 Combo 炒熱。',
  '有點酷，有點圓，滾起來像夜市小明星。',
  '清脆又可靠，常常在關鍵時刻卡住好位置。',
  '金黃登場，合成時會讓整個菜園亮一下。',
  '蓬鬆的綠色小樹，站穩後很有存在感。',
  '一層包一層，越長大越像菜園堡壘。',
  '重量級大明星，第 10 層不怕腐化。'
];

function normalizeEncyclopediaLevels(levels) {
  const normalized = (Array.isArray(levels) ? levels : [])
    .map((level) => Number(level))
    .filter((level) => Number.isInteger(level) && level >= 0 && level < VEGETABLES.length);
  return [...new Set([0, ...normalized])].sort((a, b) => a - b);
}

function setEncyclopediaLevels(levels) {
  state.encyclopediaUnlockedLevels = normalizeEncyclopediaLevels(levels);
  localStorage.setItem(ENCYCLOPEDIA_STORAGE_KEY, JSON.stringify(state.encyclopediaUnlockedLevels));
  if (encyclopediaScene && !encyclopediaScene.hidden) {
    renderEncyclopedia();
  }
}

function saveEncyclopediaLevels() {
  localStorage.setItem(ENCYCLOPEDIA_STORAGE_KEY, JSON.stringify(state.encyclopediaUnlockedLevels));
  persistEncyclopediaToSupabase().catch((error) => {
    console.warn('Encyclopedia Supabase save failed', error);
  });
}

async function persistEncyclopediaToSupabase(levels = state.encyclopediaUnlockedLevels) {
  const client = leaderboardState.client;
  const user = leaderboardState.user;
  if (!client || !user) return false;

  const rows = normalizeEncyclopediaLevels(levels).map((level) => ({
    user_id: user.id,
    level
  }));
  const { error } = await client
    .from(ENCYCLOPEDIA_TABLE)
    .upsert(rows, { onConflict: 'user_id,level', ignoreDuplicates: true });

  if (error) throw error;
  return true;
}

async function syncEncyclopediaForCurrentUser() {
  const client = leaderboardState.client;
  const user = leaderboardState.user;
  if (!client || !user) {
    if (encyclopediaScene && !encyclopediaScene.hidden) {
      renderEncyclopedia();
    }
    return;
  }

  const localLevels = normalizeEncyclopediaLevels(state.encyclopediaUnlockedLevels);
  const { data, error } = await client
    .from(ENCYCLOPEDIA_TABLE)
    .select('level')
    .eq('user_id', user.id)
    .order('level', { ascending: true });

  if (error) {
    console.warn('Encyclopedia Supabase load failed', error);
    return;
  }

  const remoteLevels = normalizeEncyclopediaLevels((data || []).map((row) => row.level));
  const mergedLevels = normalizeEncyclopediaLevels([...localLevels, ...remoteLevels]);
  setEncyclopediaLevels(mergedLevels);
  await persistEncyclopediaToSupabase(mergedLevels);
}

function unlockEncyclopediaLevel(level) {
  if (!Number.isInteger(level) || level < 0 || level >= VEGETABLES.length) return false;
  if (state.encyclopediaUnlockedLevels.includes(level)) return false;

  state.encyclopediaUnlockedLevels = [...state.encyclopediaUnlockedLevels, level].sort((a, b) => a - b);
  saveEncyclopediaLevels();
  if (encyclopediaScene && !encyclopediaScene.hidden) {
    renderEncyclopedia();
  }
  return true;
}

function highestEncyclopediaLevel() {
  return state.encyclopediaUnlockedLevels.reduce((highest, level) => Math.max(highest, level), 0);
}

function corruptionTextForLevel(level) {
  if (level >= VEGETABLES.length - 1) return '腐化狀態：第 10 層不會腐化。';
  return `腐化狀態：腐化模式中約 ${(level + 1) * CORRUPTION_SECONDS_PER_LEVEL} 秒完全腐化。`;
}

function renderEncyclopedia() {
  const unlocked = new Set(state.encyclopediaUnlockedLevels);
  const highestLevel = highestEncyclopediaLevel();
  const highestVegetable = VEGETABLES[highestLevel];

  encyclopediaSummaryEl.textContent = `已解鎖 ${unlocked.size}/${VEGETABLES.length}`;
  encyclopediaBestEl.textContent = `最高合成：${highestLevel + 1} 層 ${highestVegetable.name}`;
  encyclopediaGridEl.replaceChildren();

  VEGETABLES.forEach((vegetable, level) => {
    const isUnlocked = unlocked.has(level);
    const card = document.createElement('article');
    card.className = `encyclopedia-card${isUnlocked ? '' : ' locked'}`;

    card.innerHTML = `
      <div class="encyclopedia-image">
        ${isUnlocked ? `<img src="${escapeHtml(vegetable.imageSrc)}" alt="" />` : '<span>?</span>'}
      </div>
      <div class="encyclopedia-info">
        <small>${level + 1} 層</small>
        <strong>${isUnlocked ? escapeHtml(vegetable.name) : '尚未合成'}</strong>
        <p>${isUnlocked ? escapeHtml(VEGETABLE_DESCRIPTIONS[level]) : '合成到這一層後就會解鎖資料。'}</p>
        <em>${isUnlocked ? escapeHtml(corruptionTextForLevel(level)) : '腐化狀態：未知'}</em>
      </div>
    `;

    encyclopediaGridEl.appendChild(card);
  });
}

function openEncyclopedia() {
  renderEncyclopedia();
  encyclopediaScene.hidden = false;
}

function closeEncyclopedia() {
  encyclopediaScene.hidden = true;
}
