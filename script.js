const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
context.imageSmoothingEnabled = false;

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const messageElement = document.getElementById("message");
const restartButton = document.getElementById("restartButton");
const gameOverlayElement = document.getElementById("gameOverlay");
const overlayEyebrowElement = document.getElementById("overlayEyebrow");
const overlayTitleElement = document.getElementById("overlayTitle");
const overlayMessageElement = document.getElementById("overlayMessage");
const overlayScoreElement = document.getElementById("overlayScore");
const overlayProgressElement = document.getElementById("overlayProgress");
const overlayHintElement = document.getElementById("overlayHint");
const retryButton = document.getElementById("retryButton");

const world = {
  width: 3200,
  height: canvas.height,
  gravity: 1750,
};

const stars = Array.from({ length: 48 }, (_, index) => ({
  x: 80 + ((index * 173) % (world.width + 600)),
  y: 34 + ((index * 61) % 190),
  radius: 1 + (index % 3) * 0.8,
  alpha: 0.32 + (index % 5) * 0.08,
  parallax: 0.08 + (index % 4) * 0.03,
}));

const skyline = Array.from({ length: 15 }, (_, index) => ({
  x: index * 220 + (index % 3) * 24,
  width: 90 + (index % 4) * 20,
  height: 120 + (index % 5) * 26,
  windowOffset: (index % 3) * 4,
}));

const spawnPoint = { x: 80, y: 420 };
const player = {
  x: spawnPoint.x,
  y: spawnPoint.y,
  width: 34,
  height: 48,
  vx: 0,
  vy: 0,
  speed: 280,
  jumpForce: 820,
  maxFallSpeed: 1180,
  onGround: false,
  facing: 1,
};

const game = {
  lives: 3,
  score: 0,
  state: "playing",
  cameraX: 0,
  message: "旗を目指して進もう！",
  gameOverReason: "",
};

const keys = {
  left: false,
  right: false,
};

const solids = [
  { x: 0, y: 470, width: 420, height: 70, color: "#a96f35", accent: "#79c43c" },
  { x: 520, y: 470, width: 480, height: 70, color: "#a96f35", accent: "#79c43c" },
  { x: 1100, y: 470, width: 350, height: 70, color: "#a96f35", accent: "#79c43c" },
  { x: 1560, y: 470, width: 460, height: 70, color: "#a96f35", accent: "#79c43c" },
  { x: 2120, y: 470, width: 980, height: 70, color: "#a96f35", accent: "#79c43c" },
  { x: 290, y: 390, width: 130, height: 18, color: "#c88b48", accent: "#f7d96c" },
  { x: 690, y: 360, width: 140, height: 18, color: "#c88b48", accent: "#f7d96c" },
  { x: 880, y: 300, width: 110, height: 18, color: "#c88b48", accent: "#f7d96c" },
  { x: 1210, y: 380, width: 130, height: 18, color: "#c88b48", accent: "#f7d96c" },
  { x: 1680, y: 330, width: 120, height: 18, color: "#c88b48", accent: "#f7d96c" },
  { x: 1870, y: 270, width: 120, height: 18, color: "#c88b48", accent: "#f7d96c" },
  { x: 2230, y: 350, width: 160, height: 18, color: "#c88b48", accent: "#f7d96c" },
  { x: 2520, y: 300, width: 120, height: 18, color: "#c88b48", accent: "#f7d96c" },
  { x: 2760, y: 250, width: 140, height: 18, color: "#c88b48", accent: "#f7d96c" },
];

const hazards = [
  { x: 760, y: 448, width: 64, height: 22 },
  { x: 1330, y: 448, width: 64, height: 22 },
  { x: 1740, y: 448, width: 74, height: 22 },
  { x: 2400, y: 448, width: 74, height: 22 },
];

const collectibles = [
  { x: 332, y: 350, size: 18, collected: false },
  { x: 745, y: 320, size: 18, collected: false },
  { x: 914, y: 260, size: 18, collected: false },
  { x: 1256, y: 340, size: 18, collected: false },
  { x: 1712, y: 290, size: 18, collected: false },
  { x: 2292, y: 310, size: 18, collected: false },
  { x: 2806, y: 210, size: 18, collected: false },
];

const enemyTemplates = [
  { startX: 612, y: 426, width: 36, height: 44, patrolStart: 550, patrolEnd: 724, speed: 84 },
  { startX: 1188, y: 426, width: 36, height: 44, patrolStart: 1140, patrolEnd: 1408, speed: 92 },
  { startX: 1708, y: 286, width: 36, height: 44, patrolStart: 1684, patrolEnd: 1792, speed: 72 },
  { startX: 2564, y: 256, width: 36, height: 44, patrolStart: 2526, patrolEnd: 2634, speed: 76 },
];

const enemies = enemyTemplates.map((enemy) => ({
  ...enemy,
  x: enemy.startX,
  vx: enemy.speed,
  alive: true,
  facing: 1,
}));

const goal = { x: 3040, y: 360, width: 26, height: 110 };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getAnimationTime() {
  return (frame.lastTime || 0) / 1000;
}

function jump() {
  if (game.state !== "playing" || !player.onGround) {
    return;
  }

  player.vy = -player.jumpForce;
  player.onGround = false;
}

function resetPlayerPosition() {
  player.x = spawnPoint.x;
  player.y = spawnPoint.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
}

function resetEnemies() {
  for (const enemy of enemies) {
    enemy.x = enemy.startX;
    enemy.vx = enemy.speed;
    enemy.alive = true;
    enemy.facing = 1;
  }
}

function resetGame() {
  game.lives = 3;
  game.score = 0;
  game.state = "playing";
  game.message = "旗を目指して進もう！";
  game.cameraX = 0;
  game.gameOverReason = "";

  for (const item of collectibles) {
    item.collected = false;
  }

  resetEnemies();
  resetPlayerPosition();
  updateHud();
  updateGameOverlay();
}

function loseLife(reason) {
  if (game.state !== "playing") {
    return;
  }

  game.lives -= 1;

  if (game.lives <= 0) {
    player.vx = 0;
    player.vy = 0;
    game.state = "gameover";
    game.gameOverReason = reason;
    game.message = `${reason} ゲームオーバー。Rキーかボタンで再挑戦。`;
    updateHud();
    updateGameOverlay();
    return;
  }

  game.message = `${reason} 残りライフは ${game.lives}。`;
  resetPlayerPosition();
  updateHud();
  updateGameOverlay();
}

function collectItems() {
  for (const item of collectibles) {
    if (item.collected) {
      continue;
    }

    const itemBox = {
      x: item.x,
      y: item.y,
      width: item.size,
      height: item.size,
    };

    if (intersects(player, itemBox)) {
      item.collected = true;
      game.score += 100;
      game.message = `ジェムを獲得！ スコア ${game.score}`;
    }
  }
}

function checkGoal() {
  if (game.state !== "playing") {
    return;
  }

  const goalHitbox = {
    x: goal.x - 12,
    y: goal.y,
    width: goal.width + 24,
    height: goal.height,
  };

  if (intersects(player, goalHitbox)) {
    game.state = "won";
    game.message = `クリア！ 最終スコア ${game.score}`;
    player.vx = 0;
    player.vy = 0;
    updateGameOverlay();
  }
}

function updateEnemies(deltaTime) {
  if (game.state !== "playing") {
    return;
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    enemy.x += enemy.vx * deltaTime;

    if (enemy.x <= enemy.patrolStart) {
      enemy.x = enemy.patrolStart;
      enemy.vx = Math.abs(enemy.speed);
    } else if (enemy.x + enemy.width >= enemy.patrolEnd) {
      enemy.x = enemy.patrolEnd - enemy.width;
      enemy.vx = -Math.abs(enemy.speed);
    }

    if (enemy.vx !== 0) {
      enemy.facing = Math.sign(enemy.vx);
    }
  }
}

function handleEnemyCollisions(previousBottom) {
  for (const enemy of enemies) {
    if (!enemy.alive || !intersects(player, enemy)) {
      continue;
    }

    const stomped =
      player.vy > 0 &&
      previousBottom <= enemy.y + 10 &&
      player.y + player.height >= enemy.y;

    if (stomped) {
      enemy.alive = false;
      player.y = enemy.y - player.height;
      player.vy = -player.jumpForce * 0.5;
      player.onGround = false;
      game.score += 150;
      game.message = `敵をやっつけた！ スコア ${game.score}`;
      return false;
    }

    loseLife("敵にぶつかった！");
    return true;
  }

  return false;
}

function resolveHorizontalCollisions(previousX) {
  for (const solid of solids) {
    if (!intersects(player, solid)) {
      continue;
    }

    if (previousX + player.width <= solid.x) {
      player.x = solid.x - player.width;
    } else if (previousX >= solid.x + solid.width) {
      player.x = solid.x + solid.width;
    }
  }
}

function resolveVerticalCollisions(previousY) {
  player.onGround = false;

  for (const solid of solids) {
    if (!intersects(player, solid)) {
      continue;
    }

    if (previousY + player.height <= solid.y) {
      player.y = solid.y - player.height;
      player.vy = 0;
      player.onGround = true;
    } else if (previousY >= solid.y + solid.height) {
      player.y = solid.y + solid.height;
      player.vy = 0;
    }
  }
}

function updatePlayer(deltaTime) {
  if (game.state !== "playing") {
    return;
  }

  const horizontalInput = Number(keys.right) - Number(keys.left);
  player.vx = horizontalInput * player.speed;

  if (horizontalInput !== 0) {
    player.facing = horizontalInput;
  }

  const previousX = player.x;
  player.x += player.vx * deltaTime;
  player.x = clamp(player.x, 0, world.width - player.width);
  resolveHorizontalCollisions(previousX);

  player.vy = Math.min(player.vy + world.gravity * deltaTime, player.maxFallSpeed);
  const previousY = player.y;
  const previousBottom = previousY + player.height;
  player.y += player.vy * deltaTime;
  resolveVerticalCollisions(previousY);

  if (player.y > canvas.height + 160) {
    loseLife("穴に落ちた！");
    return;
  }

  updateEnemies(deltaTime);

  for (const hazard of hazards) {
    if (intersects(player, hazard)) {
      loseLife("トゲに当たった！");
      return;
    }
  }

  if (handleEnemyCollisions(previousBottom)) {
    return;
  }

  collectItems();
  checkGoal();

  game.cameraX = clamp(
    player.x - canvas.width * 0.35,
    0,
    world.width - canvas.width,
  );
}

function updateHud() {
  scoreElement.textContent = String(game.score);
  livesElement.textContent = String(game.lives);
  messageElement.textContent = game.message;
}

function getProgressPercent() {
  const progress = clamp(player.x / (goal.x - spawnPoint.x), 0, 1);
  return Math.round(progress * 100);
}

function getGameOverHint(reason) {
  if (reason.includes("敵")) {
    return "敵の真上を狙って踏みつけると、反動で次の足場にもつなげやすい。";
  }

  if (reason.includes("トゲ")) {
    return "ジャンプは少し手前から。頂点が障害物の中央を越えるように合わせると安定する。";
  }

  if (reason.includes("穴")) {
    return "次の足場を先に見て、焦らず助走をつけると着地しやすい。";
  }

  return "コースは覚えるほど有利。今の一回を次の突破口に変えよう。";
}

function getGameOverLead(progressPercent) {
  if (progressPercent >= 85) {
    return "あと少し。今の走りなら、次でクリアが見える。";
  }

  if (progressPercent >= 55) {
    return "かなり先まで来ている。ルートはつかめているので、このまま押し切ろう。";
  }

  return "まだここから。動きに慣れてくると一気に伸びるステージだ。";
}

function updateGameOverlay() {
  const isGameOver = game.state === "gameover";
  gameOverlayElement.hidden = !isGameOver;

  if (!isGameOver) {
    return;
  }

  const progressPercent = getProgressPercent();
  overlayTitleElement.textContent = "ゲームオーバー";
  overlayEyebrowElement.textContent = progressPercent >= 70 ? "ALMOST CLEAR" : "NEXT TRY";
  overlayMessageElement.textContent = `${game.gameOverReason} ${getGameOverLead(progressPercent)}`;
  overlayScoreElement.textContent = String(game.score);
  overlayProgressElement.textContent = `${progressPercent}%`;
  overlayHintElement.textContent = getGameOverHint(game.gameOverReason);
}

function drawBackground() {
  const animationTime = getAnimationTime();
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#67c9ff");
  sky.addColorStop(0.62, "#9adeff");
  sky.addColorStop(1, "#dff4ff");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#ffd76b";
  context.beginPath();
  context.arc(150 - game.cameraX * 0.03, 92, 50, 0, Math.PI * 2);
  context.fill();

  for (let index = 0; index < 6; index += 1) {
    const x = index * 190 - (game.cameraX * 0.18 % 190) - 40;
    const y = 84 + (index % 2) * 24;
    context.fillStyle = "#ffffff";
    context.fillRect(x, y, 42, 18);
    context.fillRect(x + 14, y - 12, 46, 20);
    context.fillRect(x + 44, y + 2, 32, 16);
  }

  context.save();
  context.fillStyle = "#86cb5c";
  for (let i = 0; i < 8; i += 1) {
    const x = i * 180 - (game.cameraX * 0.18 % 180) - 100;
    context.beginPath();
    context.moveTo(x, 430);
    context.lineTo(x + 82, 302);
    context.lineTo(x + 180, 430);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "#4f9b47";
  for (let i = 0; i < 9; i += 1) {
    const x = i * 150 - (game.cameraX * 0.3 % 150) - 80;
    context.beginPath();
    context.moveTo(x, 450);
    context.lineTo(x + 70, 322);
    context.lineTo(x + 162, 450);
    context.closePath();
    context.fill();
  }
  context.restore();

  context.fillStyle = "#90beff";
  context.fillRect(0, 390, canvas.width, 150);

  context.save();
  context.fillStyle = "#6d5d52";
  for (const building of skyline) {
    const x = building.x - game.cameraX * 0.4;
    const y = 420 - building.height;
    if (x + building.width < -40 || x > canvas.width + 40) {
      continue;
    }

    context.fillRect(x, y, building.width, building.height);
    context.fillStyle = "#f0d678";
    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 5; row += 1) {
        if ((column + row + building.windowOffset) % 2 !== 0) {
          continue;
        }

        context.fillRect(
          x + 12 + column * 18,
          y + 16 + row * 22,
          7,
          10,
        );
      }
    }
    context.fillStyle = "#6d5d52";
  }
  context.restore();

  context.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let x = 0; x < canvas.width; x += 32) {
    context.fillRect(x, 0, 2, canvas.height);
  }

  context.fillStyle = `rgba(255, 255, 255, ${0.014 + (Math.sin(animationTime * 2) + 1) * 0.004})`;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWorld() {
  const animationTime = getAnimationTime();

  context.save();
  context.translate(-game.cameraX, 0);

  for (const solid of solids) {
    context.fillStyle = solid.color;
    context.fillRect(solid.x, solid.y, solid.width, solid.height);

    const tileWidth = solid.height > 30 ? 32 : 22;
    for (let x = solid.x; x < solid.x + solid.width; x += tileWidth) {
      context.fillStyle = solid.accent;
      context.fillRect(x, solid.y, Math.min(tileWidth, solid.x + solid.width - x), 8);
      context.fillStyle = "rgba(255, 255, 255, 0.28)";
      context.fillRect(x + 2, solid.y + 2, Math.max(0, tileWidth - 6), 2);
    }

    context.fillStyle = "#73451b";
    for (let x = solid.x; x < solid.x + solid.width; x += tileWidth) {
      for (let y = solid.y + 12; y < solid.y + solid.height; y += 16) {
        context.fillRect(x, y, Math.min(tileWidth - 2, solid.x + solid.width - x), 2);
      }
    }
  }

  for (const hazard of hazards) {
    context.fillStyle = "#7c2318";
    context.fillRect(hazard.x - 4, hazard.y + 10, hazard.width + 8, hazard.height - 2);

    const spikeCount = Math.floor(hazard.width / 16);
    for (let index = 0; index < spikeCount; index += 1) {
      const spikeX = hazard.x + index * 16;
      context.fillStyle = "#ff5d4c";
      context.beginPath();
      context.moveTo(spikeX, hazard.y + hazard.height);
      context.lineTo(spikeX + 8, hazard.y);
      context.lineTo(spikeX + 16, hazard.y + hazard.height);
      context.closePath();
      context.fill();

      context.strokeStyle = "#ffd5d0";
      context.beginPath();
      context.moveTo(spikeX + 8, hazard.y + 3);
      context.lineTo(spikeX + 10, hazard.y + hazard.height - 3);
      context.stroke();
    }
  }

  for (const item of collectibles) {
    if (item.collected) {
      continue;
    }

    const centerX = item.x + item.size / 2;
    const centerY = item.y + item.size / 2 - Math.sin(animationTime * 4 + item.x * 0.03) * 4;
    const pulse = 1 + Math.sin(animationTime * 6 + item.x * 0.05) * 0.16;

    context.fillStyle = `rgba(255, 224, 102, ${0.24 * pulse})`;
    context.beginPath();
    context.arc(centerX, centerY, item.size * 0.92 * pulse, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#ffcf4a";
    context.beginPath();
    context.arc(centerX, centerY, item.size / 2, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#fff4b3";
    context.fillRect(centerX - 3, centerY - item.size / 2 + 3, 6, item.size - 6);
    context.strokeStyle = "#a96f35";
    context.strokeRect(centerX - item.size / 2, centerY - item.size / 2, item.size, item.size);
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    const bounce = Math.sin(animationTime * 5 + enemy.x * 0.02) * 1.5;
    const eyeX = enemy.facing > 0 ? enemy.x + 21 : enemy.x + 11;

    context.fillStyle = "rgba(47, 74, 116, 0.28)";
    context.beginPath();
    context.ellipse(
      enemy.x + enemy.width / 2,
      enemy.y + enemy.height + 8,
      19,
      7,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();

    context.fillStyle = "#7fc95f";
    context.fillRect(enemy.x, enemy.y + 12 + bounce, enemy.width, enemy.height - 12);
    context.fillStyle = "#acec8a";
    context.fillRect(enemy.x + 6, enemy.y + 8 + bounce, enemy.width - 12, 10);
    context.fillStyle = "#ffffff";
    context.fillRect(enemy.x + 6, enemy.y + 18 + bounce, 9, 10);
    context.fillRect(enemy.x + enemy.width - 15, enemy.y + 18 + bounce, 9, 10);
    context.fillStyle = "#2f3b52";
    context.fillRect(eyeX, enemy.y + 21 + bounce, 3, 5);
    context.fillRect(enemy.x + enemy.width / 2 - 2, enemy.y + enemy.height - 8 + bounce, 4, 8);
  }

  context.fillStyle = "#dfe9f4";
  context.fillRect(goal.x, goal.y, 6, goal.height);
  context.fillStyle = "#b8894a";
  context.fillRect(goal.x - 8, goal.y + goal.height - 16, 22, 16);
  context.fillStyle = "#ff4d5a";
  context.beginPath();
  context.moveTo(goal.x + 6, goal.y);
  context.lineTo(goal.x + 72, goal.y + 24);
  context.lineTo(goal.x + 6, goal.y + 50);
  context.closePath();
  context.fill();

  const shadowWidth = 26 + Math.abs(player.vx) * 0.04;
  context.fillStyle = "rgba(47, 74, 116, 0.24)";
  context.beginPath();
  context.ellipse(
    player.x + player.width / 2,
    player.y + player.height + 8,
    shadowWidth,
    8,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();

  if (Math.abs(player.vx) > 10) {
    const trailDirection = player.facing > 0 ? -1 : 1;
    context.fillStyle = "rgba(255, 207, 74, 0.55)";
    context.beginPath();
    context.moveTo(player.x + player.width / 2, player.y + 20);
    context.lineTo(
      player.x + player.width / 2 + trailDirection * (12 + Math.abs(player.vx) * 0.04),
      player.y + 24,
    );
    context.lineTo(player.x + player.width / 2, player.y + 28);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "#22314a";
  context.fillRect(player.x - 2, player.y - 2, player.width + 4, player.height + 4);
  context.fillStyle = "#f7d88d";
  context.fillRect(player.x + 8, player.y + 2, player.width - 16, 12);
  context.fillStyle = "#b84e3d";
  context.fillRect(player.x + 7, player.y, player.width - 14, 6);
  context.fillStyle = "#2d70d4";
  context.fillRect(player.x + 6, player.y + 16, player.width - 12, 16);
  context.fillStyle = "#ffd34e";
  context.fillRect(player.x + 12, player.y + 18, player.width - 24, 6);
  context.fillStyle = "#6b401f";
  context.fillRect(player.x + 6, player.y + 34, 8, 14);
  context.fillRect(player.x + player.width - 14, player.y + 34, 8, 14);
  context.fillStyle = "#7142c0";
  context.fillRect(player.x + 4, player.y + 14, 4, 10);
  context.fillRect(player.x + player.width - 8, player.y + 14, 4, 10);
  context.fillStyle = "#22314a";
  const eyeX = player.facing > 0 ? player.x + 18 : player.x + 12;
  context.fillRect(eyeX, player.y + 8, 3, 3);

  context.restore();
}

function drawScreenFx() {
  context.fillStyle = "rgba(33, 58, 93, 0.08)";
  for (let y = 0; y < canvas.height; y += 3) {
    context.fillRect(0, y, canvas.width, 1);
  }

  context.fillStyle = "rgba(33, 58, 93, 0.12)";
  context.fillRect(0, 0, canvas.width, 8);
  context.fillRect(0, canvas.height - 8, canvas.width, 8);
  context.fillRect(0, 0, 8, canvas.height);
  context.fillRect(canvas.width - 8, 0, 8, canvas.height);
}

function drawOverlay() {
  if (game.state === "playing") {
    return;
  }

  context.fillStyle = "rgba(47, 74, 116, 0.28)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (game.state === "gameover") {
    return;
  }

  context.textAlign = "center";
  context.shadowBlur = 0;
  context.fillStyle = "#fff6cf";
  context.font = "bold 44px sans-serif";
  context.fillText(
    game.state === "won" ? "ステージクリア" : "ゲームオーバー",
    canvas.width / 2,
    canvas.height / 2 - 24,
  );
  context.fillStyle = game.state === "won" ? "#ffd34e" : "#d94f45";
  context.font = "20px sans-serif";
  context.fillText("Rキーかボタンでリスタート", canvas.width / 2, canvas.height / 2 + 24);
}

function frame(timestamp) {
  if (!frame.lastTime) {
    frame.lastTime = timestamp;
  }

  const deltaTime = Math.min((timestamp - frame.lastTime) / 1000, 1 / 30);
  frame.lastTime = timestamp;

  updatePlayer(deltaTime);
  updateHud();
  drawBackground();
  drawWorld();
  drawScreenFx();
  drawOverlay();

  window.requestAnimationFrame(frame);
}

function handleKeyChange(isPressed, event) {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW"].includes(
      event.code,
    )
  ) {
    event.preventDefault();
  }

  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    keys.left = isPressed;
  }

  if (event.code === "ArrowRight" || event.code === "KeyD") {
    keys.right = isPressed;
  }

  if (
    isPressed &&
    (event.code === "ArrowUp" || event.code === "Space" || event.code === "KeyW")
  ) {
    jump();
  }

  if (isPressed && event.code === "KeyR") {
    resetGame();
  }
}

window.addEventListener("keydown", (event) => handleKeyChange(true, event));
window.addEventListener("keyup", (event) => handleKeyChange(false, event));
restartButton.addEventListener("click", resetGame);
retryButton.addEventListener("click", resetGame);

resetEnemies();
updateHud();
updateGameOverlay();
window.requestAnimationFrame(frame);
