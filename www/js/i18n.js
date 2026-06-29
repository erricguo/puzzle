const I18N_STORAGE_KEY = 'veggieMergeLanguage';
const I18N_DEFAULT_LANGUAGE = 'zh-Hant';
const I18N_SUPPORTED_LANGUAGES = ['zh-Hant', 'en'];

const I18N_EN_TEXT = {
  '蔬菜合成': 'Veggie Merge',
  '語言': 'Language',
  '遊戲資訊': 'Game info',
  '經驗值': 'Experience',
  '暫停遊戲': 'Pause game',
  '遊戲區': 'Game area',
  '炸彈 x0': 'Bomb x0',
  '危險線': 'Danger Line',
  '環境狀態：腐化': 'Environment: Corruption',
  '本局結算': 'Run Summary',
  '遊戲結束': 'Game Over',
  '本局成績': 'Run results',
  '使用復活券': 'Use revive ticket',
  '排行榜': 'Leaderboard',
  '再玩一次': 'Play Again',
  '暫停中': 'Paused',
  '你可以在這裡調整音量大小，確認現在聽起來是否合適。': 'Adjust volume here until it feels right.',
  '音量控制': 'Volume controls',
  '音效開關': 'Sound toggle',
  '音效': 'SFX',
  '音樂': 'Music',
  '音樂音量': 'Music volume',
  '音效音量': 'SFX volume',
  '震動效果': 'Haptics',
  '關閉震動效果': 'Disable haptics',
  '開啟震動效果': 'Enable haptics',
  '繼續遊戲': 'Resume',
  '結束遊戲': 'End Game',
  '等級 10': 'Level 10',
  '選擇技能': 'Choose Skill',
  '技能可以重複選擇並疊加效果。': 'Skills can be picked repeatedly and stacked.',
  '技能選項': 'Skill choices',
  '刷新卡片 1 次': 'Refresh cards once',
  '關閉 DEBUG 面板': 'Close DEBUG panel',
  '+10 等級': '+10 Levels',
  '跳腐化': 'Trigger Corruption',
  '豐收': 'Harvest',
  '強風': 'Strong Wind',
  '暴雨': 'Heavy Rain',
  '蟲害': 'Pests',
  '掉 10 顆南瓜': 'Drop 10 Pumpkins',
  '禁止合成': 'Disable Merge',
  '允許合成': 'Enable Merge',
  '+10000 金幣': '+10000 Coins',
  '開始畫面': 'Start screen',
  '準備好開始了嗎': 'Ready to start?',
  '合併、累積 COMBO，衝出更高分數。': 'Merge veggies, build COMBO, and chase a higher score.',
  '遊戲特色': 'Game features',
  '10 種蔬菜': '10 Veggies',
  '連鎖 COMBO': 'Combo Chains',
  'Google 登入': 'Google Sign In',
  '登出': 'Sign Out',
  '開始遊戲': 'Play',
  '每日任務': 'Daily Missions',
  '商城': 'Shop',
  '蔬菜圖鑑': 'Veggiepedia',
  '查看排行榜': 'Leaderboard',
  '圖鑑': 'Veggiepedia',
  '商店': 'Shop',
  '今日任務 0/3': 'Daily Missions 0/3',
  '關閉每日任務': 'Close daily missions',
  '每日任務列表': 'Daily mission list',
  '看廣告刷新任務': 'Watch ad to refresh',
  '每日 00:00 更新': 'Refreshes daily at 00:00',
  '永久天賦': 'Permanent Talents',
  '關閉商城': 'Close shop',
  '商城分頁': 'Shop tabs',
  '天賦商店': 'Talent Shop',
  '道具商店': 'Item Shop',
  '皮膚': 'Skins',
  '天賦列表': 'Talent list',
  '道具列表': 'Item list',
  '皮膚列表': 'Skin list',
  '已購買的天賦會在每局開始時自動生效。': 'Purchased talents activate automatically at the start of each run.',
  '道具會存入背包，遊戲中符合條件時即可使用。': 'Items are stored and can be used in game when available.',
  '皮膚會套用在主遊戲畫面，並同步到你的帳號。': 'Skins apply to the main game screen and sync to your account.',
  '選擇主遊戲畫面皮膚': 'Choose a main game skin',
  '套用': 'Apply',
  '套用中': 'Applied',
  '經典': 'Classic',
  '暖色': 'Warm',
  '霓虹': 'Neon',
  '冰藍': 'Frost',
  '已解鎖 1/10': 'Unlocked 1/10',
  '關閉蔬菜圖鑑': 'Close Veggiepedia',
  '最高合成：1 層 豌豆': 'Best merge: Lv. 1 Pea',
  '蔬菜圖鑑列表': 'Veggiepedia list',
  '關閉排行榜': 'Close leaderboard',
  '排行榜分頁': 'Leaderboard tabs',
  '經典榜': 'Classic',
  '道具榜': 'Item',
  '載入中...': 'Loading...',
  '返回主畫面': 'Back to Home',
  '分數 0': 'Score 0',
  '最高 Combo 0': 'Best Combo 0',
  '下一個：豌豆': 'Next: Pea',
  '點選蔬菜引爆炸彈': 'Tap a veggie to detonate',
  '選蔬菜': 'Pick veggie',
  '靜音': 'Muted',
  '繼續': 'Resume',
  '暫停': 'Pause',
  '已領取': 'Claimed',
  '金幣不足': 'Not enough coins',
  '已擁有': 'Owned',
  '可領取': 'Claimable',
  '進行中': 'In Progress',
  '已獲得': 'Received',
  '領取': 'Claim',
  '普通': 'Common',
  '優良': 'Uncommon',
  '稀有': 'Rare',
  '史詩': 'Epic',
  '傳說': 'Legendary',
  '對局': 'Runs',
  '合成': 'Merge',
  '分數': 'Score',
  '層數': 'Level',
  '爆裂': 'Blast',
  '無任務': 'No Missions',
  '今天沒有任務': 'No missions today',
  '明天會重新補上新任務，也可以用刷新補一輪。': 'New missions arrive tomorrow, or refresh to get another set.',
  '先休息一下': 'Take a break',
  '今日已刷新': 'Refresh used today',
  '廣告準備中...': 'Ad loading...',
  '廣告尚未設定：請接入 window.VeggieMergeAds.showRewardedRefreshAd()，並在完整看完廣告後回傳 true。': 'Ads are not configured yet.',
  '請稍後再試': 'Please try again later',
  '白': 'White',
  '綠': 'Green',
  '藍': 'Blue',
  '紫': 'Purple',
  '金': 'Gold',
  '限時': 'Timed',
  '永久': 'Permanent',
  '立即': 'Instant',
  '一次': 'Once',
  '道具': 'Item',
  '刷新卡片': 'Refresh Cards',
  '沒有可刷新卡片': 'No cards to refresh',
  '已刷新，看廣告再刷新': 'Refreshed. Watch ad to refresh again',
  '訪客玩家': 'Guest Player',
  '本局': 'This Run',
  '我的': 'Mine',
  '本局沒有分數，未列入排行榜': 'No score this run, not submitted.',
  '本局 COMBO 為 0，未列入排行榜': 'COMBO was 0, not submitted.',
  '目前還沒有紀錄，先來打第一筆吧': 'No records yet. Be the first!',
  'Supabase is required for leaderboard.': 'Supabase is required for leaderboard.',
  'Supabase is not ready. Score was not submitted.': 'Supabase is not ready. Score was not submitted.',
  'Connecting to Supabase...': 'Connecting to Supabase...',
  'Supabase is required. Please check configuration.': 'Supabase is required. Please check configuration.',
  '復活券': 'Revive Tickets',
  '炸彈': 'Bombs',
  '張': '',
  '顆': '',
  '腐化': 'Corruption',
  '凍結': 'Frozen',
  '保險': 'Insurance',
  '環境狀態': 'Environment',
  '小蘿蔔': 'Carrot',
  '豌豆': 'Pea',
  '洋蔥': 'Onion',
  '番茄': 'Tomato',
  '茄子': 'Eggplant',
  '甜椒': 'Bell Pepper',
  '玉米': 'Corn',
  '花椰菜': 'Broccoli',
  '高麗菜': 'Cabbage',
  '南瓜': 'Pumpkin',
  '尚未合成': 'Not merged yet',
  '合成到這一層後就會解鎖資料。': 'Merge to this level to unlock details.',
  '腐化狀態：未知': 'Corruption: Unknown'
};

const I18N_EN_PATTERNS = [
  [/^分數 ([\d,]+)$/u, 'Score $1'],
  [/^最高 Combo ([\d,]+)$/u, 'Best Combo $1'],
  [/^下一個：(.+)$/u, (_, veg) => `Next: ${i18nTranslateText(veg)}`],
  [/^肥料剩餘: ([\d,]+)$/u, 'Fertilizer left: $1'],
  [/^炸彈 ([\d,]+)\/3$/u, 'Bomb $1/3'],
  [/^炸彈 x([\d,]+)$/u, 'Bomb x$1'],
  [/^等級 ([\d,]+)$/u, 'Level $1'],
  [/^今日任務 ([\d,]+)\/([\d,]+)$/u, 'Daily Missions $1/$2'],
  [/^每日 00:00 更新 · (.+)$/u, 'Refreshes daily at 00:00 · $1'],
  [/^已解鎖 ([\d,]+)\/([\d,]+)$/u, 'Unlocked $1/$2'],
  [/^最高合成：([\d,]+) 層 (.+)$/u, (_, level, veg) => `Best merge: Lv. ${level} ${i18nTranslateText(veg)}`],
  [/^([\d,]+) 層$/u, 'Lv. $1'],
  [/^腐化狀態：腐化模式中約 ([\d,]+) 秒完全腐化。$/u, 'Corruption: Fully corrupts after about $1s in corruption mode.'],
  [/^腐化狀態：第 ([\d,]+) 層不會腐化。$/u, 'Corruption: Lv. $1 does not corrupt.'],
  [/^已擁有 ([\d,]+)\/([\d,]+)$/u, 'Owned $1/$2'],
  [/^復活券 ([\d,]+) 張 · 炸彈 ([\d,]+) 顆$/u, 'Revive Tickets $1 · Bombs $2'],
  [/^啟用 (.+)$/u, (_, name) => `Activated ${i18nTranslateText(name)}`],
  [/^獲得 ([\d,]+) 金幣$/u, 'Got $1 coins'],
  [/^獲得 (.+) x([\d,]+)$/u, (_, name, qty) => `Got ${i18nTranslateText(name)} x${qty}`],
  [/^領取 ([\d,]+)$/u, 'Claim $1'],
  [/^廣告目前無法顯示：(.+)$/u, 'Ad unavailable: $1'],
  [/^送出失敗: (.+)$/u, 'Submit failed: $1'],
  [/^讀取失敗: (.+)$/u, 'Load failed: $1'],
  [/^COMBO ([\d,]+) 凍結(.*)$/u, (_, combo, tail) => `COMBO ${combo} Frozen${i18nTranslateText(tail)}`],
  [/^ 保險x([\d,]+)$/u, ' Insurance x$1'],
  [/^環境狀態：(.+)$/u, (_, value) => `Environment: ${i18nTranslateText(value)}`],
  [/^(.+) ([\d,]+)s$/u, (_, name, sec) => `${i18nTranslateText(name)} ${sec}s`],
  [/^(.+) \/ (.+)$/u, (_, a, b) => `${i18nTranslateText(a)} / ${i18nTranslateText(b)}`]
];

const I18N_DATA_EN = {
  vegetables: ['Pea', 'Carrot', 'Onion', 'Tomato', 'Eggplant', 'Bell Pepper', 'Corn', 'Broccoli', 'Cabbage', 'Pumpkin'],
  vegetableDescriptions: [
    'A tiny sprout full of possibility.',
    'A crisp root veggie with solid momentum.',
    'Layered and sturdy, a reliable middle step.',
    'Juicy and bright, ready to roll.',
    'Glossy and heavy enough to shift the pile.',
    'A colorful veggie with satisfying bounce.',
    'Golden kernels packed with combo energy.',
    'A sturdy crown of green florets.',
    'A round leafy heavyweight.',
    'The grand harvest prize.'
  ],
  dailyMissions: {
    play_1: ['One Run Today', 'Finish 1 run today.'],
    play_2: ['One More Run', 'Finish 2 runs today.'],
    merge_20: ['Merge Practice', 'Merge veggies 20 times today.'],
    merge_35: ['Casual Merging', 'Merge veggies 35 times today.'],
    blast_8: ['Small Cleanup', 'Clear 8 veggies with blasts today.'],
    score_1200: ['First Score Push', 'Reach 1200 points in one run.'],
    score_1800: ['Steady Rhythm', 'Reach 1800 points in one run.'],
    combo_6: ['Combo Basics', 'Reach Combo 6 in one run.'],
    combo_10: ['Combo Formed', 'Reach Combo 10 in one run.'],
    level_5: ['Garden Growth', 'Merge up to a level 5 veggie today.'],
    play_3: ['Three-Run Warmup', 'Finish 3 runs today.'],
    play_4: ['Back for More', 'Finish 4 runs today.'],
    merge_50: ['Skilled Merging', 'Merge veggies 50 times today.'],
    merge_70: ['Continuous Tilling', 'Merge veggies 70 times today.'],
    blast_18: ['Medium Cleanup', 'Clear 18 veggies with blasts today.'],
    blast_25: ['Blast Adept', 'Clear 25 veggies with blasts today.'],
    score_3000: ['Garden Scorer', 'Reach 3000 points in one run.'],
    score_4500: ['Scoring Rhythm', 'Reach 4500 points in one run.'],
    combo_20: ['Combo Specialist', 'Reach Combo 20 in one run.'],
    level_8: ['Advanced Growing', 'Merge up to a level 8 veggie today.'],
    play_5: ['Five-Run Stamina', 'Finish 5 runs today.'],
    merge_90: ['High-Intensity Merge', 'Merge veggies 90 times today.'],
    merge_120: ['Massive Tilling', 'Merge veggies 120 times today.'],
    blast_40: ['Cleanup Master', 'Clear 40 veggies with blasts today.'],
    blast_60: ['Blast Expert', 'Clear 60 veggies with blasts today.'],
    score_6000: ['Road to High Score', 'Reach 6000 points in one run.'],
    score_9000: ['Score Legend', 'Reach 9000 points in one run.'],
    combo_35: ['Combo Master', 'Reach Combo 35 in one run.'],
    combo_50: ['Combo Legend', 'Reach Combo 50 in one run.'],
    level_10: ['Elite Veggie Grower', 'Merge up to a level 10 veggie today.']
  },
  talents: {
    quick_level: ['Early Sprout', 'Start each run at Lv 3 and get your first skill card faster.', 'Start Lv 3'],
    combo_memory: ['Combo Echo', 'Combo timer lasts 0.25 seconds longer.', 'Combo +0.25s'],
    gentle_drop: ['Stable Drop', 'Veggies fall slightly slower, making stacking easier.', 'Gravity -8%'],
    extra_refresh: ['Backup Inspiration', 'Gain 1 extra free refresh per skill choice.', 'Skill Refresh +1'],
    stable_preview: ['Stable Preview', 'Show one extra upcoming veggie to plan ahead.', 'Preview +1'],
    precision_drop: ['Precision Drop', 'Reduce random horizontal drop speed by 20%.', 'Drift -20%'],
    basket_expand: ['Bigger Basket', 'Game ends 0.4 seconds later after touching the danger line.', 'Danger +0.4s'],
    mission_expert: ['Mission Expert', 'Daily mission coin rewards increase by 10%.', 'Mission Reward +10%'],
    inspiration_pity: ['Inspiration Safety Net', 'Refreshing skill cards guarantees at least 1 unseen card this round.', 'Refresh Guarantee']
  },
  items: {
    bomb: ['Bomb', 'Use in game to choose a veggie and blast nearby veggies.', 'Targeted blast'],
    revive_ticket: ['Revive Ticket', 'Use at game over to clear the top 30 veggies and continue.', 'Stacks in inventory']
  },
  skins: {
    garden: ['Morning Garden', 'Fresh green theme for the original veggie merge feel.', 'Classic'],
    sunset: ['Sunset Farm', 'Warm orange-red colors with a harvest mood.', 'Warm'],
    midnight: ['Neon Night Market', 'Dark neon style that makes veggies and combos pop.', 'Neon'],
    frost: ['Frost Greenhouse', 'Cool glasshouse colors, bright and clean.', 'Frost']
  },
  skills: {
    fast_fall: ['Fast Fall', 'For 5 seconds, veggies fall 50% faster and drop cadence increases by 30%.'],
    combo_freeze: ['Combo Freeze', 'For 5 seconds, Combo time does not expire.'],
    double_drop: ['Double Drop', 'For 5 seconds, drop two veggies at once.'],
    combo_score: ['Combo Boost', 'Permanent COMBO score bonus +10%.'],
    drop_speed: ['Gravity Grow', 'Permanent veggie fall speed +10%.'],
    blast_three: ['Veggie Blast', 'Randomly blast three veggies and clear nearby veggies.'],
    magnet_merge: ['Magnet Merge', 'For 10 seconds, same-level veggies gently pull together.'],
    clear_peas: ['Small Veggie Clear', 'Clear all level 1 veggies and gain a little score.'],
    precision_aim: ['Precision Aim', 'For 15 seconds, show an aim guide and reduce horizontal drift.'],
    combo_insurance: ['Combo Insurance', 'The next time Combo breaks, keep your current Combo once.'],
    random_upgrade: ['Veggie Upgrade', 'Randomly upgrade 1 low-level veggie by 1 level.'],
    golden_time: ['Golden Time', 'For 20 seconds, score gain +20%.'],
    safety_cushion: ['Safety Cushion', 'For 15 seconds, danger line detection is delayed by 1 second.'],
    lift_pulse: ['Lift Pulse', 'Give all veggies a small upward push immediately.'],
    merge_sense: ['Same-Color Sense', 'For 12 seconds, same-level veggies merge more easily when close.'],
    reroll_next: ['Reroll Next', 'Reroll the next veggie immediately, capped at level 3.'],
    fertilizer: ['Fertilizer', 'The next 5 drops become fertilizer and upgrade the veggie they hit.']
  },
  environmentEvents: {
    strong_wind: ['Strong Wind', 'Drop path drifts slightly'],
    heavy_rain: ['Heavy Rain', 'Veggies become slippery'],
    pest: ['Pests', 'Combo bonus -30%'],
    harvest: ['Harvest', 'Combo timer lasts longer']
  }
};

let i18nCurrentLanguage = localStorage.getItem(I18N_STORAGE_KEY) || I18N_DEFAULT_LANGUAGE;
if (!I18N_SUPPORTED_LANGUAGES.includes(i18nCurrentLanguage)) {
  i18nCurrentLanguage = I18N_DEFAULT_LANGUAGE;
}

const i18nTextSources = new WeakMap();
const i18nAttributeSources = new WeakMap();
let i18nTranslating = false;
let i18nOriginalDataCaptured = false;

function currentLanguage() {
  return i18nCurrentLanguage;
}

function i18nData(path, fallback = '') {
  const parts = String(path).split('.');
  let value = I18N_DATA_EN;
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) return fallback;
  }
  return i18nCurrentLanguage === 'en' ? value : fallback;
}

function i18nTranslateText(value) {
  const text = String(value ?? '');
  if (i18nCurrentLanguage !== 'en' || !text.trim()) return text;

  const trimmed = text.trim();
  const leading = text.match(/^\s*/)?.[0] || '';
  const trailing = text.match(/\s*$/)?.[0] || '';
  const exact = I18N_EN_TEXT[trimmed];
  if (exact) return `${leading}${exact}${trailing}`;

  for (const [pattern, replacement] of I18N_EN_PATTERNS) {
    const match = trimmed.match(pattern);
    if (!match) continue;
    const translated = typeof replacement === 'function'
      ? replacement(...match)
      : trimmed.replace(pattern, replacement);
    return `${leading}${translated}${trailing}`;
  }

  return text;
}

function translateTextNode(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue.trim()) return;
  if (!i18nTextSources.has(node)) {
    i18nTextSources.set(node, node.nodeValue);
  }
  const source = i18nTextSources.get(node);
  const nextValue = i18nTranslateText(source);
  if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
}

function translateElementAttributes(element) {
  if (!element?.getAttributeNames) return;
  const translatableAttrs = ['aria-label', 'title', 'placeholder', 'alt'];
  let sourceMap = i18nAttributeSources.get(element);
  if (!sourceMap) {
    sourceMap = {};
    i18nAttributeSources.set(element, sourceMap);
  }

  translatableAttrs.forEach((attr) => {
    if (!element.hasAttribute(attr)) return;
    if (!sourceMap[attr]) sourceMap[attr] = element.getAttribute(attr);
    const nextValue = i18nTranslateText(sourceMap[attr]);
    if (element.getAttribute(attr) !== nextValue) element.setAttribute(attr, nextValue);
  });
}

function translateNode(root = document.body) {
  if (!root) return;
  const translateRecursive = (node) => {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      translateTextNode(node);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName?.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'option') return;
      translateElementAttributes(node);
      node.childNodes.forEach((child) => translateRecursive(child));
    }
  };

  if (i18nTranslating) return;
  i18nTranslating = true;
  try {
    translateRecursive(root);
  } finally {
    i18nTranslating = false;
  }
}

function translatePage() {
  document.documentElement.lang = i18nCurrentLanguage;
  document.title = i18nTranslateText('蔬菜合成');
  translateNode(document.body);
}

function setLanguage(language) {
  if (!I18N_SUPPORTED_LANGUAGES.includes(language)) return;
  const previousLanguage = i18nCurrentLanguage;
  i18nCurrentLanguage = language;
  localStorage.setItem(I18N_STORAGE_KEY, language);
  const selector = document.getElementById('languageSelect');
  if (selector && selector.value !== language) selector.value = language;
  if (previousLanguage !== I18N_DEFAULT_LANGUAGE && language === I18N_DEFAULT_LANGUAGE) {
    window.location.reload();
    return;
  }
  applyDataTranslations();
  translatePage();
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
}

function setupI18n() {
  const selector = document.getElementById('languageSelect');
  if (selector) {
    selector.value = i18nCurrentLanguage;
    selector.addEventListener('change', () => setLanguage(selector.value));
  }

  captureOriginalDataTranslations();
  applyDataTranslations();
  translatePage();
  const observer = new MutationObserver((mutations) => {
    if (i18nTranslating) return;
    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') {
        if (!i18nTextSources.has(mutation.target) || i18nCurrentLanguage === I18N_DEFAULT_LANGUAGE) {
          i18nTextSources.set(mutation.target, mutation.target.nodeValue);
        }
        translateNode(mutation.target);
      } else if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => translateNode(node));
      } else if (mutation.type === 'attributes') {
        const sourceMap = i18nAttributeSources.get(mutation.target);
        if (sourceMap) delete sourceMap[mutation.attributeName];
        translateElementAttributes(mutation.target);
      }
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title', 'placeholder', 'alt']
  });
}

function captureOriginalDataTranslations() {
  if (i18nOriginalDataCaptured) return;
  i18nOriginalDataCaptured = true;

  if (typeof VEGETABLES !== 'undefined') {
    VEGETABLES.forEach((vegetable) => {
      vegetable.originalName = vegetable.originalName || vegetable.name;
    });
  }

  if (typeof VEGETABLE_DESCRIPTIONS !== 'undefined') {
    window.VEGETABLE_DESCRIPTION_ZH = window.VEGETABLE_DESCRIPTION_ZH || [...VEGETABLE_DESCRIPTIONS];
  }

  if (typeof DAILY_MISSION_DEFS !== 'undefined') {
    DAILY_MISSION_DEFS.forEach((mission) => {
      mission.titleZh = mission.titleZh || mission.title;
      mission.descriptionZh = mission.descriptionZh || mission.description;
    });
  }

  if (typeof TALENT_DEFS !== 'undefined') {
    TALENT_DEFS.forEach((talent) => {
      talent.nameZh = talent.nameZh || talent.name;
      talent.summaryZh = talent.summaryZh || talent.summary;
      talent.effectZh = talent.effectZh || talent.effect;
    });
  }

  if (typeof ITEM_SHOP_DEFS !== 'undefined') {
    ITEM_SHOP_DEFS.forEach((item) => {
      item.nameZh = item.nameZh || item.name;
      item.summaryZh = item.summaryZh || item.summary;
      item.effectZh = item.effectZh || item.effect;
    });
  }

  if (typeof SKIN_DEFS !== 'undefined') {
    SKIN_DEFS.forEach((skin) => {
      skin.nameZh = skin.nameZh || skin.name;
      skin.summaryZh = skin.summaryZh || skin.summary;
      skin.effectZh = skin.effectZh || skin.effect;
    });
  }

  if (typeof SKILL_POOL !== 'undefined') {
    SKILL_POOL.forEach((skill) => {
      skill.nameZh = skill.nameZh || skill.name;
      skill.descriptionZh = skill.descriptionZh || skill.description;
    });
  }

  if (typeof ENVIRONMENT_EVENT_DEFS !== 'undefined') {
    Object.values(ENVIRONMENT_EVENT_DEFS).forEach((def) => {
      def.nameZh = def.nameZh || def.name;
      def.descriptionZh = def.descriptionZh || def.description;
    });
  }
}

function applyDataTranslations() {
  if (typeof VEGETABLES !== 'undefined') {
    VEGETABLES.forEach((vegetable, index) => {
      vegetable.name = i18nCurrentLanguage === 'en'
        ? I18N_DATA_EN.vegetables[index] || vegetable.name
        : vegetable.originalName || vegetable.name;
    });
  }

  if (typeof VEGETABLE_DESCRIPTIONS !== 'undefined') {
    VEGETABLE_DESCRIPTIONS.forEach((description, index) => {
      VEGETABLE_DESCRIPTIONS[index] = i18nCurrentLanguage === 'en'
        ? I18N_DATA_EN.vegetableDescriptions[index] || description
        : VEGETABLE_DESCRIPTION_ZH?.[index] || description;
    });
  }

  if (typeof DAILY_MISSION_DEFS !== 'undefined') {
    DAILY_MISSION_DEFS.forEach((mission) => {
      const translated = I18N_DATA_EN.dailyMissions[mission.id];
      mission.title = i18nCurrentLanguage === 'en' ? translated?.[0] || mission.title : mission.titleZh || mission.title;
      mission.description = i18nCurrentLanguage === 'en' ? translated?.[1] || mission.description : mission.descriptionZh || mission.description;
    });
  }

  if (typeof TALENT_DEFS !== 'undefined') {
    TALENT_DEFS.forEach((talent) => {
      const translated = I18N_DATA_EN.talents[talent.id];
      talent.name = i18nCurrentLanguage === 'en' ? translated?.[0] || talent.name : talent.nameZh || talent.name;
      talent.summary = i18nCurrentLanguage === 'en' ? translated?.[1] || talent.summary : talent.summaryZh || talent.summary;
      talent.effect = i18nCurrentLanguage === 'en' ? translated?.[2] || talent.effect : talent.effectZh || talent.effect;
    });
  }

  if (typeof ITEM_SHOP_DEFS !== 'undefined') {
    ITEM_SHOP_DEFS.forEach((item) => {
      const translated = I18N_DATA_EN.items[item.id];
      item.name = i18nCurrentLanguage === 'en' ? translated?.[0] || item.name : item.nameZh || item.name;
      item.summary = i18nCurrentLanguage === 'en' ? translated?.[1] || item.summary : item.summaryZh || item.summary;
      item.effect = i18nCurrentLanguage === 'en' ? translated?.[2] || item.effect : item.effectZh || item.effect;
    });
  }

  if (typeof SKIN_DEFS !== 'undefined') {
    SKIN_DEFS.forEach((skin) => {
      const translated = I18N_DATA_EN.skins[skin.id];
      skin.name = i18nCurrentLanguage === 'en' ? translated?.[0] || skin.name : skin.nameZh || skin.name;
      skin.summary = i18nCurrentLanguage === 'en' ? translated?.[1] || skin.summary : skin.summaryZh || skin.summary;
      skin.effect = i18nCurrentLanguage === 'en' ? translated?.[2] || skin.effect : skin.effectZh || skin.effect;
    });
  }

  if (typeof SKILL_POOL !== 'undefined') {
    SKILL_POOL.forEach((skill) => {
      const translated = I18N_DATA_EN.skills[skill.id];
      skill.name = i18nCurrentLanguage === 'en' ? translated?.[0] || skill.name : skill.nameZh || skill.name;
      skill.description = i18nCurrentLanguage === 'en' ? translated?.[1] || skill.description : skill.descriptionZh || skill.description;
    });
  }

  if (typeof ENVIRONMENT_EVENT_DEFS !== 'undefined') {
    Object.entries(ENVIRONMENT_EVENT_DEFS).forEach(([id, def]) => {
      const translated = I18N_DATA_EN.environmentEvents[id];
      def.name = i18nCurrentLanguage === 'en' ? translated?.[0] || def.name : def.nameZh || def.name;
      def.description = i18nCurrentLanguage === 'en' ? translated?.[1] || def.description : def.descriptionZh || def.description;
    });
  }
}

window.currentLanguage = currentLanguage;
window.i18nData = i18nData;
window.i18nTranslateText = i18nTranslateText;
window.setLanguage = setLanguage;
window.addEventListener('DOMContentLoaded', setupI18n, { once: true });
