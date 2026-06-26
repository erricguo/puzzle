const {
  Engine,
  Render,
  Runner,
  Bodies,
  Body,
  Composite,
  Events,
  Vector
} = Matter;

const VEGETABLES = [
  { name: '豌豆', imageSrc: 'assets/vegetables/01-pea.png', color: '#80bf43', radius: 18 },
  { name: '小蘿蔔', imageSrc: 'assets/vegetables/02-carrot.png', color: '#f08a33', radius: 22 },
  { name: '洋蔥', imageSrc: 'assets/vegetables/03-onion.png', color: '#d9a7d7', radius: 26 },
  { name: '番茄', imageSrc: 'assets/vegetables/04-tomato.png', color: '#f05b4f', radius: 31 },
  { name: '茄子', imageSrc: 'assets/vegetables/05-eggplant.png', color: '#8760a8', radius: 36 },
  { name: '甜椒', imageSrc: 'assets/vegetables/06-bell-pepper.png', color: '#49a757', radius: 41 },
  { name: '玉米', imageSrc: 'assets/vegetables/07-corn.png', color: '#f5ca45', radius: 47 },
  { name: '花椰菜', imageSrc: 'assets/vegetables/08-broccoli.png', color: '#4f9f55', radius: 53 },
  { name: '高麗菜', imageSrc: 'assets/vegetables/09-cabbage.png', color: '#93c56c', radius: 60 },
  { name: '南瓜', imageSrc: 'assets/vegetables/10-pumpkin.png', color: '#e58a2f', radius: 68 }
];

const MERGE_SCORE_BY_LEVEL = [
  0,
  5,
  15,
  30,
  60,
  150,
  400,
  1000,
  3000,
  8000
];

const vegetableImages = VEGETABLES.map((vegetable) => {
  const image = new Image();
  image.src = vegetable.imageSrc;
  return image;
});

const COMBO_BASE_DURATION = 500;
const COMBO_GROWTH = 1.05;
const COMBO_MAX_DURATION = 2000;
const COMBO_IMPACT_DURATION = 520;
const COMBO_SHAKE_DURATION = 280;
const COMBO_SCORE_STEP = 0.1;
const COMBO_COLORS = ['#68d84d', '#ffd447', '#ff8c32', '#ff5bbd', '#8d70ff', '#35d7ff'];
const BACKGROUND_MUSIC_SRC = 'assets/sound/Juice%20Merge%20Parade.mp3';
const REVIVE_BLAST_COUNT = 30;
const STARTING_REVIVE_TICKETS = 1;
const ITEM_BOMB_RADIUS = 120;
const BOMB_USES_PER_RUN = 3;
const DEBUG_ENABLED = true;

const CORRUPTION_UNLOCK_LEVEL = 50;
const CORRUPTION_SECONDS_PER_LEVEL = 10;
const PUMPKIN_LEVEL = VEGETABLES.length - 1;
const PUMPKIN_AURA_RADIUS = 150;

const ENV_EVENT_DURATION = 30000;
const HARVEST_EVENT_DURATION = 15000;
const ENV_EVENT_RANDOM_UNLOCK_LEVEL = 20;
const ENV_EVENT_RANDOM_ROLL_INTERVAL = 10000;
const ENV_EVENT_RANDOM_CHANCE = 0.12;
const STRONG_WIND_FORCE = 3.4;
const STRONG_WIND_BODY_FORCE = 0.00038;
const HEAVY_RAIN_FRICTION_MULTIPLIER = 0.32;
const PEST_COMBO_SCORE_MULTIPLIER = 0.7;
const HARVEST_COMBO_BONUS = 700;
const HARVEST_CORRUPTION_RECOVERY_MULTIPLIER = 2.5;
