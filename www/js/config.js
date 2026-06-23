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
const COMBO_COLORS = ['#68d84d', '#ffd447', '#ff8c32', '#ff5bbd', '#8d70ff', '#35d7ff'];
const BACKGROUND_MUSIC_SRC = 'assets/sound/Juice%20Merge%20Parade.mp3';
