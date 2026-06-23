const engine = Engine.create({
  gravity: { x: 0, y: 1.05 }
});
const BASE_GRAVITY_Y = 1.05;
const world = engine.world;
const runner = Runner.create();

const state = {
  width: 0,
  height: 0,
  score: 0,
  scoreRemainder: 0,
  bestLevel: 1,
  nextLevel: 0,
  aiming: false,
  aimX: 0,
  pointerId: null,
  hasStarted: false,
  paused: false,
  gameOver: false,
  lastDropAt: 0,
  suppressDropUntil: 0,
  dangerY: 132,
  combo: 0,
  bestCombo: 0,
  comboDuration: 0,
  comboExpiresAt: 0,
  comboPulseStartedAt: 0,
  comboPulseColor: COMBO_COLORS[0],
  playerLevel: 1,
  exp: 0,
  expToNext: 12,
  pendingSkillChoices: 0,
  isChoosingSkill: false,
  skillRefreshesRemaining: 0,
  skillRefreshAdBusy: false,
  currentSkillChoiceIds: [],
  selectedSkills: [],
  comboScoreBonus: 0,
  dropSpeedBonus: 0,
  fastFallExpiresAt: 0,
  comboFreezeExpiresAt: 0,
  comboFreezeLastAt: 0,
  doubleDropExpiresAt: 0,
  fertilizerCharges: 0,
  activeSkillLevel: 0,
  scoreSaved: false
};

const comboBursts = [];
const blastEffects = [];
const fertilizerEffects = [];
const audioState = {
  context: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  musicBuffer: null,
  musicSource: null,
  musicLoading: null,
  enabled: localStorage.getItem('veggieMergeSoundEnabled') !== 'false',
  musicVolume: Number(localStorage.getItem('veggieMergeMusicVolume') || localStorage.getItem('veggieMergeVolume') || 0.7),
  sfxVolume: Number(localStorage.getItem('veggieMergeSfxVolume') || 0.85)
};
const hapticsState = {
  enabled: localStorage.getItem('veggieMergeHapticsEnabled') !== 'false'
};
const leaderboardState = {
  activeTab: 'score',
  rows: {
    score: [],
    combo: []
  },
  localRows: loadLocalLeaderboard(),
  isConfigured: false,
  client: null,
  authSubscription: null,
  user: null,
  isAuthBusy: false,
  guestPlayerId: localStorage.getItem('veggieMergeGuestPlayerId')
    || localStorage.getItem('veggieMergePlayerId')
    || createPlayerId(),
  guestPlayerName: localStorage.getItem('veggieMergeGuestPlayerName')
    || localStorage.getItem('veggieMergePlayerName')
    || `玩家 ${Math.floor(Math.random() * 9000 + 1000)}`,
  playerId: '',
  playerName: ''
};
leaderboardState.playerId = leaderboardState.guestPlayerId;
leaderboardState.playerName = leaderboardState.guestPlayerName;
localStorage.setItem('veggieMergeGuestPlayerId', leaderboardState.guestPlayerId);
localStorage.setItem('veggieMergeGuestPlayerName', leaderboardState.guestPlayerName);
localStorage.setItem('veggieMergePlayerId', leaderboardState.playerId);
localStorage.setItem('veggieMergePlayerName', leaderboardState.playerName);

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
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2)
  }
});
