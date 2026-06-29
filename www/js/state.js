const engine = Engine.create({
  gravity: { x: 0, y: 1.0 }
});
const BASE_GRAVITY_Y = 1.0;
const world = engine.world;
const runner = Runner.create();

const state = {
  width: 0,
  height: 0,
  wallWidth: 0,
  wallHeight: 0,
  score: 0,
  scoreRemainder: 0,
  fpsValue: 0,
  fpsFrames: 0,
  fpsLastAt: 0,
  encyclopediaUnlockedLevels: loadEncyclopediaLevels(),
  dailyMissionState: loadDailyMissionState(),
  dailyMissionRefreshAdBusy: false,
  coins: loadPlayerCoins(),
  reviveTickets: loadReviveTickets(),
  bombs: loadBombs(),
  selectedSkin: loadSelectedSkin(),
  bombsUsedThisRun: 0,
  ownedTalents: loadOwnedTalents(),
  bestLevel: 1,
  nextLevel: 0,
  previewLevel: null,
  aiming: false,
  bombTargeting: false,
  aimX: 0,
  pointerId: null,
  hasStarted: false,
  paused: false,
  pageActive: !document.hidden,
  gameOver: false,
  gameOverActionsLocked: false,
  lastDropAt: 0,
  suppressDropUntil: 0,
  dangerY: 132,
  combo: 0,
  bestCombo: 0,
  comboDuration: 0,
  comboExpiresAt: 0,
  comboPulseStartedAt: 0,
  comboPulseColor: COMBO_COLORS[0],
  feverTimeExpiresAt: 0,
  feverTimeStartedAt: 0,
  feverTimeTriggered: false,
  playerLevel: 1,
  exp: 0,
  expToNext: 100,
  corruptionActive: false,
  corruptionLastAt: 0,
  debugCorruptionUnlocked: false,
  debugMergeDisabled: false,
  activeEnvironmentEvents: [],
  environmentEventsPausedAt: 0,
  nextEnvironmentEventRollAt: 0,
  pendingSkillChoices: 0,
  isChoosingSkill: false,
  skillRefreshesRemaining: 0,
  skillFreeRefreshUsedThisRun: false,
  skillRefreshAdBusy: false,
  currentSkillChoiceIds: [],
  skillChoicesUnlockAt: 0,
  activeSkillTimers: {},
  selectedSkills: [],
  comboScoreBonus: 0,
  dropSpeedBonus: 0,
  fastFallExpiresAt: 0,
  comboFreezeExpiresAt: 0,
  comboFreezeLastAt: 0,
  doubleDropExpiresAt: 0,
  magnetMergeExpiresAt: 0,
  precisionAimExpiresAt: 0,
  goldenTimeExpiresAt: 0,
  safetyCushionExpiresAt: 0,
  mergeSenseExpiresAt: 0,
  fertilizerCharges: 0,
  activeSkillLevel: 0,
  comboInsuranceCharges: 0,
  itemBoardRun: false,
  reviveUsedThisRun: false,
  scoreSaved: false
};

const comboBursts = [];
const comboInsuranceEffects = [];
const blastEffects = [];
const fertilizerEffects = [];
const audioState = {
  context: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  musicBuffer: null,
  musicSource: null,
  musicStartedAt: 0,
  musicOffset: 0,
  musicLoading: null,
  comboNoiseBuffer: null,
  comboNoiseSampleRate: 0,
  enabled: true,
  musicVolume: 0.7,
  sfxVolume: 0.85
};
const hapticsState = {
  enabled: true
};
const leaderboardState = {
  activeTab: 'classic',
  rows: {
    classic: [],
    item: []
  },
  localRows: loadLocalLeaderboard(),
  isConfigured: false,
  client: null,
  authSubscription: null,
  user: null,
  isAuthBusy: false,
  isIdentityReady: false,
  identitySyncToken: 0,
  guestSessionSnapshot: null,
  recentScoreRow: null,
  recentScoreRank: null,
  guestPlayerId: createPlayerId(),
  guestPlayerName: createGuestDisplayName(),
  playerId: '',
  playerName: ''
};
leaderboardState.playerId = leaderboardState.guestPlayerId;
leaderboardState.playerName = leaderboardState.guestPlayerName;

const walls = {
  floor: null,
  left: null,
  right: null
};

const render = Render.create({
  element: container,
  engine,
  options: {
    width: 360,
    height: 640,
    background: 'transparent',
    wireframes: false,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 3)
  }
});
