// Canvas ayarları
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* Global Ayarlar */
// %30 zorlaştırma: başlangıç değerleri %30 artırıldı
let enemySpeedMultiplier = 1.3;
let enemyBaseHP = 1.3;
let waterDamage = 1;
let balance = 500.0; // Başlangıç bakiyesi
let faucetHP = 3;
let gameOver = false;

/* Seviye & XP Sistemi */
let playerXP = 0;
let currentLevel = 1;
let xpThreshold = 100;
let bestLevel = 0;
let bestXP = 0;

/* Özel Yetenek Ayarları */
const specialAbilityCooldown = 60000; // 60 sn cooldown
let specialAbilityLastUsed = -specialAbilityCooldown;

/* Upgrade Maliyetleri */
let costFaster = 2;
let costStronger = 2;
let costSlow = 2;
document.getElementById('costFaster').innerText = costFaster;
document.getElementById('costStronger').innerText = costStronger;
document.getElementById('costSlow').innerText = costSlow;

/* Income Sistemi: 
   Income = (baseIncome + (investmentLevel * 0.5)) * currentLevel * 0.5
   Her saniye balance’a ekleniyor. */
let investmentLevel = 0;
let investCost = 50;
document.getElementById('invest').innerText = "Yatırım ($" + investCost + ")";
const baseIncome = 5;
function updateIncome() {
  let income = (baseIncome + investmentLevel * 0.5) * currentLevel * 0.5;
  document.getElementById('income').innerText = "Income: $" + income.toFixed(2) + "/s";
}
// Her 1 sn income’u balance’a ekle
setInterval(() => {
  let income = (baseIncome + investmentLevel * 0.5) * currentLevel * 0.5;
  balance += income;
  updateBalance();
}, 1000);

/* Güncelleme Fonksiyonları */
function updateBalance() {
  document.getElementById('balance').innerText = "Balance: $" + balance.toFixed(2);
}
function updateHealth() {
  document.getElementById('health').innerText = "Health: " + faucetHP;
}
function updateLevelInfo() {
  document.getElementById('levelInfo').innerText =
    "Level: " + currentLevel + " | XP: " + playerXP + "/" + xpThreshold + " | Best: " + bestLevel;
}

/* Görev (Mission) Sistemi */
let missions = [];
function generateMissions() {
  missions = [];
  const upgradeMissions = [
    { type: "stronger", description: "Suyu Güçlendir 2 kez kullan", target: 2 },
    { type: "slow", description: "Yavaşlat 1 kez kullan", target: 1 },
    { type: "buyHealth", description: "Can Al 1 kez yap", target: 1 },
    { type: "invest", description: "Yatırım yap 1 kez kullan", target: 1 }
  ];
  let shuffled = upgradeMissions.sort(() => Math.random() - 0.5);
  missions = shuffled.slice(0, 3);
  missions.forEach(m => m.progress = 0);
  updateMissionsDisplay();
}

function updateMissionsDisplay() {
  const missionsDiv = document.getElementById('missions');
  let html = "<h3>Görevler</h3>";
  missions.forEach(m => {
    html += `<div>${m.description} (${m.progress}/${m.target})</div>`;
  });
  missionsDiv.innerHTML = html;
}

function updateMissionProgress(type, count) {
  missions.forEach(mission => {
    if (mission.type === type) {
      mission.progress += count;
    }
  });
  updateMissionsDisplay();
  if (missions.every(m => m.progress >= m.target)) {
    playerXP += currentLevel * 1000;
    updateLevelInfo();
    generateMissions();
  }
}
generateMissions();

/* Düşman güçlenmesi: Her 5 sn */
setInterval(() => {
  enemySpeedMultiplier += 0.65; // %30 artış
  enemyBaseHP += 2.6; // %30 artış
  console.log("Güçlendi:", enemySpeedMultiplier, enemyBaseHP);
}, 5000);

/* Dağ koordinatları */
const mountain = {
  peak: { x: canvas.width / 2, y: canvas.height * 0.2 },
  leftBase: { x: canvas.width * 0.1, y: canvas.height * 0.9 },
  rightBase: { x: canvas.width * 0.9, y: canvas.height * 0.9 }
};

/* Musluk konumu */
const faucet = {
  x: mountain.peak.x,
  y: mountain.peak.y,
  fireRate: 1000,
  lastShot: 0
};

/* Düşman ve Boss dizileri */
let enemies = [];  
let bosses = [];   
let waters = [];   

/* --- Düşman Sınıfları --- */
class Fire {
  constructor() {
    const baseX = Math.random() * (mountain.rightBase.x - mountain.leftBase.x) + mountain.leftBase.x;
    this.x = baseX;
    this.y = canvas.height * 0.9;
    const dx = faucet.x - this.x;
    const dy = faucet.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.baseVx = (dx / distance) * 1.0;
    this.baseVy = (dy / distance) * 1.0;
    this.radius = 15;
    this.hp = enemyBaseHP * 0.7;
    this.maxHP = this.hp;
    this.difficulty = 1;
  }
  update() {
    this.x += this.baseVx * enemySpeedMultiplier;
    this.y += this.baseVy * enemySpeedMultiplier;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = 'orange';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.hp), this.x, this.y + 4);
  }
}

class IceEnemy {
  constructor() {
    const baseX = Math.random() * (mountain.rightBase.x - mountain.leftBase.x) + mountain.leftBase.x;
    this.x = baseX;
    this.y = canvas.height * 0.9;
    const dx = faucet.x - this.x;
    const dy = faucet.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.baseVx = (dx / distance) * 0.8;
    this.baseVy = (dy / distance) * 0.8;
    this.radius = 15;
    this.hp = enemyBaseHP * 1.5 * 0.7;
    this.maxHP = this.hp;
    this.difficulty = 2;
  }
  update() {
    this.x += this.baseVx * enemySpeedMultiplier;
    this.y += this.baseVy * enemySpeedMultiplier;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = 'cyan';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.hp), this.x, this.y + 4);
  }
}

class GreenEnemy {
  constructor() {
    const baseX = Math.random() * (mountain.rightBase.x - mountain.leftBase.x) + mountain.leftBase.x;
    this.x = baseX;
    this.y = canvas.height * 0.9;
    const dx = faucet.x - this.x;
    const dy = faucet.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.baseVx = (dx / distance) * 1.2;
    this.baseVy = (dy / distance) * 1.2;
    this.radius = 15;
    this.hp = enemyBaseHP * 0.7;
    this.maxHP = this.hp;
    this.difficulty = 3;
  }
  update() {
    this.x += this.baseVx * enemySpeedMultiplier;
    this.y += this.baseVy * enemySpeedMultiplier;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = 'lime';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.hp), this.x, this.y + 4);
  }
}

class PurpleEnemy {
  constructor() {
    const baseX = Math.random() * (mountain.rightBase.x - mountain.leftBase.x) + mountain.leftBase.x;
    this.x = baseX;
    this.y = canvas.height * 0.9;
    const dx = faucet.x - this.x;
    const dy = faucet.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.baseVx = (dx / distance) * 0.9;
    this.baseVy = (dy / distance) * 0.9;
    this.radius = 15;
    this.hp = enemyBaseHP * 2 * 0.7;
    this.maxHP = this.hp;
    this.difficulty = 4;
  }
  update() {
    this.x += this.baseVx * enemySpeedMultiplier;
    this.y += this.baseVy * enemySpeedMultiplier;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = 'purple';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.hp), this.x, this.y + 4);
  }
}

class BrownEnemy {
  constructor() {
    const baseX = Math.random() * (mountain.rightBase.x - mountain.leftBase.x) + mountain.leftBase.x;
    this.x = baseX;
    this.y = canvas.height * 0.9;
    const dx = faucet.x - this.x;
    const dy = faucet.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.baseVx = (dx / distance) * 1.0;
    this.baseVy = (dy / distance) * 1.0;
    this.radius = 15;
    this.hp = enemyBaseHP * 0.7;
    this.maxHP = this.hp;
    this.difficulty = 2;
  }
  update() {
    this.x += this.baseVx * enemySpeedMultiplier;
    this.y += this.baseVy * enemySpeedMultiplier;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = 'brown';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.hp), this.x, this.y + 4);
  }
}

class Boss {
  constructor() {
    const baseX = Math.random() * (mountain.rightBase.x - mountain.leftBase.x) + mountain.leftBase.x;
    this.x = baseX;
    this.y = canvas.height * 0.9;
    const dx = faucet.x - this.x;
    const dy = faucet.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.baseVx = (dx / distance) * 3;
    this.baseVy = (dy / distance) * 3;
    this.radius = 20;
    this.hp = enemyBaseHP * 5 * 0.7;
    this.maxHP = this.hp;
    this.difficulty = 5;
  }
  update() {
    this.x += this.baseVx * enemySpeedMultiplier;
    this.y += this.baseVy * enemySpeedMultiplier;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = 'green';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.hp), this.x, this.y + 5);
  }
}

class SlowBoss {
  constructor() {
    const baseX = Math.random() * (mountain.rightBase.x - mountain.leftBase.x) + mountain.leftBase.x;
    this.x = baseX;
    this.y = canvas.height * 0.9;
    const dx = faucet.x - this.x;
    const dy = faucet.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.baseVx = (dx / distance) * 0.5;
    this.baseVy = (dy / distance) * 0.5;
    this.radius = 25;
    this.hp = enemyBaseHP * 20 * 0.7;
    this.maxHP = this.hp;
    this.difficulty = 6;
  }
  update() {
    this.x += this.baseVx * enemySpeedMultiplier;
    this.y += this.baseVy * enemySpeedMultiplier;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = 'darkblue';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(this.hp), this.x, this.y + 6);
  }
}

/* Su mermisi */
class Water {
  constructor(target, angleOffset = 0) {
    this.x = faucet.x;
    this.y = faucet.y;
    const dx = target.x - faucet.x;
    const dy = target.y - faucet.y;
    let angle = Math.atan2(dy, dx) + angleOffset;
    this.vx = Math.cos(angle) * 4.0;
    this.vy = Math.sin(angle) * 4.0;
    this.radius = 5;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = 'aqua';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* Hedef seçimi */
function selectTarget() {
  let potentialTargets = enemies.concat(bosses);
  if (potentialTargets.length === 0) return null;
  let target = potentialTargets[0];
  for (let t of potentialTargets) {
    if (t.y < target.y) {
      target = t;
    }
  }
  return target;
}

/* Düşman Oluşturma: Her 308 ms’de (400ms'in %30 zorlaştırılmış hali) */
let lastEnemySpawn = 0;
function spawnEnemy(timestamp) {
  if (timestamp - lastEnemySpawn > 308) {
    const r = Math.random();
    let enemy;
    if (r < 0.2) {
      enemy = new Fire();
    } else if (r < 0.4) {
      enemy = new IceEnemy();
    } else if (r < 0.6) {
      enemy = new GreenEnemy();
    } else if (r < 0.8) {
      enemy = new PurpleEnemy();
    } else {
      enemy = new BrownEnemy();
    }
    enemies.push(enemy);
    lastEnemySpawn = timestamp;
  }
}

/* Boss Oluşturma: Her 23.077 sn’de (30.000ms'in %30 zorlaştırılmış hali) */
let lastBossSpawn = 0;
function spawnBoss(timestamp) {
  if (timestamp - lastBossSpawn > 23077) {
    if (Math.random() < 0.5) {
      bosses.push(new Boss());
    } else {
      bosses.push(new SlowBoss());
    }
    lastBossSpawn = timestamp;
  }
}

/* Seviye Atlaması */
function checkLevelUp() {
  if (playerXP >= xpThreshold) {
    currentLevel++;
    playerXP -= xpThreshold;
    xpThreshold = Math.floor(xpThreshold * 1.5);
    updateLevelInfo();
    updateIncome();
  }
}

/* FAST SHOT (Hızlı Su) Butonu */
let multiShotLevel = 1;
document.getElementById('fasterShot').addEventListener('click', () => {
  // costFaster 10'dan büyükse yükseltme yapılamaz
  if (costFaster > 10) return;
  
  if (balance >= costFaster) {
    balance -= costFaster;
    if (faucet.fireRate > 200) {
      faucet.fireRate = Math.max(200, faucet.fireRate - 200);
    } else if (multiShotLevel < 3) {
      multiShotLevel++;
    }
    costFaster++;
    // Eğer yükseltme sonrası costFaster 10'un üzerine çıkarsa butonu devre dışı bırak
    if(costFaster > 10) {
      document.getElementById('costFaster').innerText = "MAX";
      document.getElementById('fasterShot').disabled = true;
    } else {
      document.getElementById('costFaster').innerText = costFaster;
    }
    updateBalance();
  }
});

/* STRONGER SHOT Butonu */
document.getElementById('strongerShot').addEventListener('click', () => {
  if (balance >= costStronger) {
    balance -= costStronger;
    waterDamage += 1;
    costStronger++;
    document.getElementById('costStronger').innerText = costStronger;
    updateBalance();
    updateMissionProgress("stronger", 1);
  }
});

/* SLOW DOWN Butonu */
document.getElementById('slowDown').addEventListener('click', () => {
  if (balance >= costSlow) {
    balance -= costSlow;
    enemySpeedMultiplier = Math.max(0.5, enemySpeedMultiplier - 0.3);
    costSlow++;
    document.getElementById('costSlow').innerText = costSlow;
    updateBalance();
    updateMissionProgress("slow", 1);
  }
});

/* Can Al Butonu */
document.getElementById('buyHealth').addEventListener('click', () => {
  if (balance >= 20) {
    balance -= 20;
    faucetHP++;
    updateBalance();
    updateHealth();
    updateMissionProgress("buyHealth", 1);
  }
});

/* Invest Butonu */
document.getElementById('invest').addEventListener('click', () => {
  if (balance >= investCost) {
    balance -= investCost;
    investmentLevel++;
    investCost = Math.floor(investCost * 1.2);
    document.getElementById('invest').innerText = "Yatırım ($" + investCost + ")";
    updateBalance();
    updateIncome();
    updateMissionProgress("invest", 1);
  }
});

/* Özel Yetenek: Tüm düşman ve bosslara hasar */
document.getElementById('specialAbility').addEventListener('click', () => {
  const now = performance.now();
  if (now - specialAbilityLastUsed >= 60000) {
    const specialDamage = currentLevel * 50;
    for (let i = enemies.length - 1; i >= 0; i--) {
      enemies[i].hp -= specialDamage;
      if (enemies[i].hp <= 0) {
        playerXP += enemies[i].difficulty * 10;
        balance += 1 + enemies[i].maxHP / 8;
        enemies.splice(i, 1);
        checkLevelUp();
      }
    }
    for (let i = bosses.length - 1; i >= 0; i--) {
      bosses[i].hp -= specialDamage;
      if (bosses[i].hp <= 0) {
        playerXP += bosses[i].difficulty * 10;
        balance += 1 + bosses[i].maxHP / 8;
        bosses.splice(i, 1);
        checkLevelUp();
      }
    }
    specialAbilityLastUsed = now;
    document.getElementById('specialAbility').innerText = "Special (Cooldown)";
    setTimeout(() => {
      document.getElementById('specialAbility').innerText = "Special";
    }, 1000);
    updateBalance();
    updateLevelInfo();
  }
});

/* New Game Butonu */
document.getElementById('newGame').addEventListener('click', () => {
  // Zorlaştırılmış başlangıç değerleriyle reset
  enemySpeedMultiplier = 1.3;
  enemyBaseHP = 1.3;
  waterDamage = 1;
  balance = 50.0;
  faucetHP = 3;
  playerXP = 0;
  currentLevel = 1;
  xpThreshold = 100;
  faucet.fireRate = 1000;
  
  enemies = [];
  bosses = [];
  waters = [];
  
  costFaster = 2;
  costStronger = 2;
  costSlow = 2;
  investCost = 50;
  investmentLevel = 0;
  document.getElementById('costFaster').innerText = costFaster;
  document.getElementById('costStronger').innerText = costStronger;
  document.getElementById('costSlow').innerText = costSlow;
  document.getElementById('invest').innerText = "Yatırım ($" + investCost + ")";
  
  updateBalance();
  updateHealth();
  updateLevelInfo();
  updateIncome();
  
  gameOver = false;
  document.getElementById('newGame').style.display = 'none';
  faucet.lastShot = 0;
  specialAbilityLastUsed = -specialAbilityCooldown;
  multiShotLevel = 1;
  generateMissions();
  requestAnimationFrame(gameLoop);
});

/* Oyun Döngüsü */
function gameLoop(timestamp) {
  if (gameOver) {
    if (currentLevel > bestLevel || (currentLevel === bestLevel && playerXP > bestXP)) {
      bestLevel = currentLevel;
      bestXP = playerXP;
    }
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = "bold 32px Arial";
    ctx.fillText("Seviyen: " + currentLevel + " | XP: " + playerXP, canvas.width / 2, canvas.height / 2);
    ctx.fillText("Best: " + bestLevel + " | XP: " + bestXP, canvas.width / 2, canvas.height / 2 + 40);
    document.getElementById('newGame').style.display = 'block';
    return;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Dağ çizimi
  ctx.beginPath();
  ctx.moveTo(mountain.leftBase.x, mountain.leftBase.y);
  ctx.lineTo(mountain.peak.x, mountain.peak.y);
  ctx.lineTo(mountain.rightBase.x, mountain.rightBase.y);
  ctx.closePath();
  ctx.fillStyle = '#654321';
  ctx.fill();
  
  // Musluk çizimi
  ctx.fillStyle = 'silver';
  ctx.fillRect(faucet.x - 10, faucet.y - 20, 20, 20);
  
  // Düşman ve Boss üretimi
  spawnEnemy(timestamp);
  spawnBoss(timestamp);
  
  // Düşmanları güncelle & çiz
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.update();
    enemy.draw();
    const dx = enemy.x - faucet.x;
    const dy = enemy.y - faucet.y;
    if (Math.hypot(dx, dy) < 20) {
      faucetHP--;
      updateHealth();
      enemies.splice(i, 1);
      if (faucetHP <= 0) gameOver = true;
    }
  }
  
  // Bossları güncelle & çiz
  for (let i = bosses.length - 1; i >= 0; i--) {
    const boss = bosses[i];
    boss.update();
    boss.draw();
    const dx = boss.x - faucet.x;
    const dy = boss.y - faucet.y;
    if (Math.hypot(dx, dy) < 20) {
      faucetHP--;
      updateHealth();
      bosses.splice(i, 1);
      if (faucetHP <= 0) gameOver = true;
    }
  }
  
  // Su atışı
  if (timestamp - faucet.lastShot > faucet.fireRate) {
    let target = selectTarget();
    if (target) {
      for (let s = 0; s < multiShotLevel; s++) {
        let offset = 0;
        if (multiShotLevel === 2) { offset = (s === 0 ? -0.05 : 0.05); }
        else if (multiShotLevel === 3) { offset = (s === 0 ? -0.1 : (s === 1 ? 0 : 0.1)); }
        waters.push(new Water(target, offset));
      }
      faucet.lastShot = timestamp;
    }
  }
  
  // Su mermilerini güncelle, çiz ve çarpışma kontrolü
  for (let w = waters.length - 1; w >= 0; w--) {
    const water = waters[w];
    water.update();
    water.draw();
    let hit = false;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      const dx = water.x - enemy.x;
      const dy = water.y - enemy.y;
      if (Math.hypot(dx, dy) < enemy.radius + water.radius) {
        enemy.hp -= waterDamage;
        hit = true;
        if (enemy instanceof GreenEnemy) updateMissionProgress("green", 1);
        if (enemy.hp <= 0) {
          playerXP += enemy.difficulty * 10;
          balance += 1 + enemy.maxHP / 8;
          updateBalance();
          updateLevelInfo();
          enemies.splice(i, 1);
          checkLevelUp();
        }
        break;
      }
    }
    for (let i = bosses.length - 1; i >= 0; i--) {
      const boss = bosses[i];
      const dx = water.x - boss.x;
      const dy = water.y - boss.y;
      if (Math.hypot(dx, dy) < boss.radius + water.radius) {
        boss.hp -= waterDamage;
        hit = true;
        if (boss.hp <= 0) {
          playerXP += boss.difficulty * 10;
          balance += 1 + boss.maxHP / 8;
          updateBalance();
          updateLevelInfo();
          bosses.splice(i, 1);
          checkLevelUp();
        }
        break;
      }
    }
    if (hit) waters.splice(w, 1);
  }
  
  // Özel Yetenek butonu cooldown kontrolü
  const specialBtn = document.getElementById('specialAbility');
  const timeSinceSpecial = timestamp - specialAbilityLastUsed;
  if (timeSinceSpecial < 60000) {
    const remaining = Math.ceil((60000 - timeSinceSpecial) / 1000);
    specialBtn.innerText = remaining;
  } else {
    specialBtn.innerText = "Special";
  }
  
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

/* Eğer New Game butonu başlangıçta görünmüyorsa gizle */
if (gameOver) {
  document.getElementById('newGame').style.display = 'block';
}
document.getElementById('fasterShot').addEventListener('click', () => {
  // Eğer costFaster 14'ten büyükse satın alma yapılamaz
  if (costFaster > 14) return;
  
  if (balance >= costFaster) {
    balance -= costFaster;
    if (faucet.fireRate > 200) {
      faucet.fireRate = Math.max(200, faucet.fireRate - 200);
    } else if (multiShotLevel < 3) {
      multiShotLevel++;
    }
    costFaster++;
    // Eğer costFaster 14'ten büyükse butonu devre dışı bırak ve "MAX" yaz
    if(costFaster > 14) {
      document.getElementById('costFaster').innerText = "MAX";
      document.getElementById('fasterShot').disabled = true;
    } else {
      document.getElementById('costFaster').innerText = costFaster;
    }
    updateBalance();
  }
});
document.getElementById('strongerShot10x').addEventListener('click', () => {
  for (let i = 0; i < 10; i++) {
    if (balance >= costStronger) {
      balance -= costStronger;
      waterDamage += 1;
      costStronger++;
      updateMissionProgress("stronger", 1);
    } else {
      break;
    }
  }
  document.getElementById('costStronger').innerText = costStronger;
  updateBalance();
});

document.getElementById('slowDown10x').addEventListener('click', () => {
  for (let i = 0; i < 10; i++) {
    if (balance >= costSlow) {
      balance -= costSlow;
      enemySpeedMultiplier = Math.max(0.5, enemySpeedMultiplier - 0.3);
      costSlow++;
      updateMissionProgress("slow", 1);
    } else {
      break;
    }
  }
  document.getElementById('costSlow').innerText = costSlow;
  updateBalance();
});