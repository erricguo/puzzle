// 水果等級設定 (由小到大 10 種)
const FRUIT_LEVELS = [
  {name:'櫻桃', color:'#ff4d6d', r:18},
  {name:'草莓', color:'#ff6f61', r:22},
  {name:'蘋果', color:'#ff9966', r:26},
  {name:'橘子', color:'#ffb86b', r:30},
  {name:'鳳梨', color:'#ffd166', r:34},
  {name:'芒果', color:'#ffd54a', r:38},
  {name:'梨子', color:'#c7f9cc', r:42},
  {name:'葡萄', color:'#b39ddb', r:46},
  {name:'西瓜', color:'#90ee90', r:52},
  {name:'榴槤', color:'#f0e68c', r:60}
];

const { Engine, Render, Runner, World, Bodies, Body, Events, Mouse, MouseConstraint, Composite, Vector } = Matter;

const engine = Engine.create();
const world = engine.world;

const container = document.getElementById('canvas-container');
const width = window.innerWidth; const height = window.innerHeight;

const render = Render.create({
  element: container,
  engine: engine,
  options: { width, height, wireframes: false, background: 'transparent' }
});
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// 地板與牆
const thickness = 80;
World.add(world, [
  Bodies.rectangle(width/2, height+thickness/2, width, thickness, { isStatic:true }),
  Bodies.rectangle(-thickness/2, height/2, thickness, height, { isStatic:true }),
  Bodies.rectangle(width+thickness/2, height/2, thickness, height, { isStatic:true })
]);

// 分數與等級顯示
let score = 0;
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
let maxReachedLevel = 0;
function addScore(v){ score += v; scoreEl.textContent = '分數: ' + score }
function updateLevelDisplay(lvl){
  maxReachedLevel = Math.max(maxReachedLevel, lvl);
  levelEl.textContent = '等級: ' + (maxReachedLevel+1);
}

// 建立水果
function createFruit(level, x, y){
  const cfg = FRUIT_LEVELS[level];
  const b = Bodies.circle(x, y, cfg.r, { restitution:0.4, friction:0.02, label:'fruit' });
  b.render.fillStyle = cfg.color;
  b.fruitLevel = level;
  b.isMerging = false;
  World.add(world, b);
  updateLevelDisplay(level);
  return b;
}

// 點擊生成小水果
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, { mouse, constraint:{ stiffness: 0.2, render:{visible:false} } });
World.add(world, mouseConstraint);
render.mouse = mouse;

// 預覽與點擊掉落：使用 `nextFruitLevel`，點擊會從上方掉落到點擊的 x 座標
let nextFruitLevel = 0;
function generateNext(){
  // 目前隨機生成 0 或 1 級的小果子（可調整成更廣的隨機範圍）
  nextFruitLevel = Math.floor(Math.random()*2);
}

generateNext();

// 拖曳與觸控支援：pointer 事件
let dragging = false;
let dragX = width/2;
let dragPointerId = null;

function getPointerX(e){
  const rect = render.canvas.getBoundingClientRect();
  return e.clientX - rect.left;
}

render.canvas.addEventListener('pointerdown', (e)=>{
  render.canvas.setPointerCapture && render.canvas.setPointerCapture(e.pointerId);
  dragging = true;
  dragPointerId = e.pointerId;
  dragX = getPointerX(e);
});

render.canvas.addEventListener('pointermove', (e)=>{
  if (!dragging || e.pointerId !== dragPointerId) return;
  dragX = getPointerX(e);
});

render.canvas.addEventListener('pointerup', (e)=>{
  if (e.pointerId !== dragPointerId) return;
  render.canvas.releasePointerCapture && render.canvas.releasePointerCapture(e.pointerId);
  // 在釋放時掉下水果
  const x = dragX;
  const f = createFruit(nextFruitLevel, x, -40);
  Body.setVelocity(f, { x: (Math.random()-0.5)*2, y: 0 });
  generateNext();
  dragging = false;
  dragPointerId = null;
});

// 合併邏輯
// 合併邏輯：需為同等級、未標記合併，且碰撞速度超過門檻
const MERGE_VELOCITY_THRESHOLD = 1.2;
Events.on(engine, 'collisionStart', function(ev){
  for (let pair of ev.pairs){
    const a = pair.bodyA, b = pair.bodyB;
    if (a.label !== 'fruit' || b.label !== 'fruit') continue;
    if (typeof a.fruitLevel !== 'number' || typeof b.fruitLevel !== 'number') continue;
    if (a.isMerging || b.isMerging) continue;
    if (a.fruitLevel !== b.fruitLevel) continue;
    if (a.fruitLevel >= FRUIT_LEVELS.length-1) continue;

    // 相對速度判斷，避免緩慢接觸時就合併
    const relVel = Vector.sub(a.velocity, b.velocity);
    const speed = Math.hypot(relVel.x, relVel.y);
    if (speed < MERGE_VELOCITY_THRESHOLD) continue;

    a.isMerging = b.isMerging = true;
    const lvl = a.fruitLevel;
    const pos = { x: (a.position.x + b.position.x)/2, y: (a.position.y + b.position.y)/2 };

    // 視覺特效：push a small pop effect
    pushEffect(pos.x, pos.y, FRUIT_LEVELS[lvl].color);

    setTimeout(()=>{
      try{ Composite.remove(world, a); Composite.remove(world, b); }catch(e){}
      const newFruit = createFruit(lvl+1, pos.x, pos.y-10);
      Body.setVelocity(newFruit, { x: 0, y: -3 });
      addScore((lvl+1)*10);
      updateLevelDisplay(lvl+1);
    }, 80);
  }
});

// 特效：簡單的擴散圓圈
const effects = [];
function pushEffect(x,y,color){ effects.push({x,y,color,life:1,r:6}); }

// 繪製水果名稱與特效
Events.on(render, 'afterRender', function(){
  const ctx = render.context;
  ctx.save();
  // 水果名稱
  ctx.fillStyle = '#222';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  for (let body of Composite.allBodies(world)){
    if (body.label === 'fruit' && typeof body.fruitLevel === 'number'){
      const lvl = body.fruitLevel;
      const name = FRUIT_LEVELS[lvl].name;
      ctx.fillText(name, body.position.x, body.position.y+4);
    }
  }

  // draw preview (跟隨拖曳或位於上方中央)
  const py = 36;
  const px = (typeof dragging !== 'undefined' && dragging) ? dragX : width/2;
  const pCfg = FRUIT_LEVELS[nextFruitLevel];
  ctx.beginPath();
  ctx.fillStyle = pCfg.color;
  ctx.arc(px, py, pCfg.r, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.font = '13px sans-serif';
  ctx.fillText('預覽: ' + pCfg.name, px, py + pCfg.r + 16);

  // 若在拖曳，畫出目標指示線
  if (dragging){
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.setLineDash([6,6]);
    ctx.beginPath(); ctx.moveTo(px, py + pCfg.r + 22); ctx.lineTo(px, height); ctx.stroke();
    ctx.restore();
  }

  // draw effects
  for (let i = effects.length-1; i>=0; i--){
    const e = effects[i];
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * (1 + (1-e.life)), 0, Math.PI*2);
    ctx.strokeStyle = e.color;
    ctx.globalAlpha = e.life * 0.9;
    ctx.lineWidth = 3 * e.life;
    ctx.stroke();
    ctx.globalAlpha = 1;
    e.life -= 0.06;
    if (e.life <= 0) effects.splice(i,1);
  }

  ctx.restore();
});

// 重玩按鈕
let spawnIntervalId = null;
function startAutoSpawn(){
  if (spawnIntervalId) clearInterval(spawnIntervalId);
  spawnIntervalId = setInterval(()=>{
    const x = 60 + Math.random()*(width-120);
    createFruit(0, x, -40);
  }, 1400);
}

function stopAutoSpawn(){ if (spawnIntervalId) { clearInterval(spawnIntervalId); spawnIntervalId = null; } }

document.getElementById('btnRestart').addEventListener('click', ()=>{
  const bodies = Composite.allBodies(world).slice();
  for (let b of bodies){ if (b.label==='fruit') Composite.remove(world, b); }
  score = 0; scoreEl.textContent = '分數: 0';
  maxReachedLevel = 0; levelEl.textContent = '等級: 1';
  effects.length = 0;
  generateNext();
});

// 一開始不自動生成示範水果，畫面初始為空，等待玩家放置
