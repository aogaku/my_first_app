const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

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

const billboards = [
  { x: 180, y: 252, width: 108, height: 38, label: "VOID" },
  { x: 920, y: 232, width: 114, height: 36, label: "NOVA" },
  { x: 1660, y: 216, width: 128, height: 42, label: "XR-9" },
  { x: 2420, y: 238, width: 132, height: 40, label: "ZEN" },
];

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
  { x: 0, y: 470, width: 420, height: 70, color: "#08111f", accent: "#00f6ff", glow: "#7b61ff" },
  { x: 520, y: 470, width: 480, height: 70, color: "#08111f", accent: "#00f6ff", glow: "#7b61ff" },
  { x: 1100, y: 470, width: 350, height: 70, color: "#08111f", accent: "#00f6ff", glow: "#7b61ff" },
  { x: 1560, y: 470, width: 460, height: 70, color: "#08111f", accent: "#00f6ff", glow: "#7b61ff" },
  { x: 2120, y: 470, width: 980, height: 70, color: "#08111f", accent: "#00f6ff", glow: "#7b61ff" },
  { x: 290, y: 390, width: 130, height: 18, color: "#190c34", accent: "#ff37e3", glow: "#00f6ff" },
  { x: 690, y: 360, width: 140, height: 18, color: "#190c34", accent: "#ff37e3", glow: "#00f6ff" },
  { x: 880, y: 300, width: 110, height: 18, color: "#190c34", accent: "#ff37e3", glow: "#00f6ff" },
  { x: 1210, y: 380, width: 130, height: 18, color: "#190c34", accent: "#ff37e3", glow: "#00f6ff" },
  { x: 1680, y: 330, width: 120, height: 18, color: "#190c34", accent: "#ff37e3", glow: "#00f6ff" },
  { x: 1870, y: 270, width: 120, height: 18, color: "#190c34", accent: "#ff37e3", glow: "#00f6ff" },
  { x: 2230, y: 350, width: 160, height: 18, color: "#190c34", accent: "#ff37e3", glow: "#00f6ff" },
  { x: 2520, y: 300, width: 120, height: 18, color: "#190c34", accent: "#ff37e3", glow: "#00f6ff" },
  { x: 2760, y: 250, width: 140, height: 18, color: "#190c34", accent: "#ff37e3", glow: "#00f6ff" },
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
  overlayEyebrowElement.textContent = progressPercent >= 70 ? "NEAR THE GOAL" : "MISSION FAILED";
  overlayMessageElement.textContent = `${game.gameOverReason} ${getGameOverLead(progressPercent)}`;
  overlayScoreElement.textContent = String(game.score);
  overlayProgressElement.textContent = `${progressPercent}%`;
  overlayHintElement.textContent = getGameOverHint(game.gameOverReason);
}

function drawBackground() {
  const animationTime = getAnimationTime();
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#03030a");
  sky.addColorStop(0.22, "#081029");
  sky.addColorStop(0.58, "#210a42");
  sky.addColorStop(1, "#110914");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.globalAlpha = 0.86;
  context.fillStyle = "rgba(255, 55, 227, 0.14)";
  context.beginPath();
  context.ellipse(canvas.width * 0.48, 96, 280, 58, -0.08, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(0, 246, 255, 0.12)";
  context.beginPath();
  context.ellipse(canvas.width * 0.64, 118, 240, 44, 0.12, 0, Math.PI * 2);
  context.fill();
  context.restore();

  const moonX = canvas.width - 190 - game.cameraX * 0.05;
  context.save();
  context.shadowColor = "rgba(255, 55, 227, 0.42)";
  context.shadowBlur = 42;
  context.strokeStyle = "#ff5ce2";
  context.lineWidth = 10;
  context.beginPath();
  context.arc(moonX, 98, 52, 0, Math.PI * 2);
  context.stroke();
  context.shadowColor = "rgba(0, 246, 255, 0.32)";
  context.shadowBlur = 30;
  context.strokeStyle = "#00f6ff";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(moonX, 98, 64, 0.22, Math.PI * 1.82);
  context.stroke();
  context.fillStyle = "rgba(8, 4, 24, 0.78)";
  context.beginPath();
  context.arc(moonX, 98, 39, 0, Math.PI * 2);
  context.fill();
  context.restore();

  for (const star of stars) {
    const x = star.x - game.cameraX * star.parallax;
    if (x < -20 || x > canvas.width + 20) {
      continue;
    }

    const alpha = star.alpha * (0.9 + Math.sin(animationTime * 3 + star.x * 0.02) * 0.25);
    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    context.beginPath();
    context.arc(x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();

    if (star.radius > 2) {
      context.strokeStyle = `rgba(0, 246, 255, ${alpha * 0.65})`;
      context.beginPath();
      context.moveTo(x - 4, star.y);
      context.lineTo(x + 4, star.y);
      context.moveTo(x, star.y - 4);
      context.lineTo(x, star.y + 4);
      context.stroke();
    }
  }

  context.save();
  for (let i = 0; i < 6; i += 1) {
    const beamX = i * 210 - (game.cameraX * 0.1 % 210) - 140;
    const beamGradient = context.createLinearGradient(beamX, 0, beamX + 160, canvas.height);
    beamGradient.addColorStop(0, "rgba(0, 246, 255, 0.08)");
    beamGradient.addColorStop(1, "rgba(255, 55, 227, 0)");
    context.fillStyle = beamGradient;
    context.beginPath();
    context.moveTo(beamX, 0);
    context.lineTo(beamX + 140, 0);
    context.lineTo(beamX + 20, canvas.height);
    context.lineTo(beamX - 120, canvas.height);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "rgba(3, 7, 21, 0.48)";
  for (let i = 0; i < 8; i += 1) {
    const x = i * 230 - (game.cameraX * 0.16 % 230) - 120;
    context.beginPath();
    context.moveTo(x, 430);
    context.lineTo(x + 110, 210);
    context.lineTo(x + 240, 430);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "rgba(9, 10, 25, 0.78)";
  for (let i = 0; i < 9; i += 1) {
    const x = i * 180 - (game.cameraX * 0.26 % 180) - 90;
    context.beginPath();
    context.moveTo(x, 450);
    context.lineTo(x + 90, 250);
    context.lineTo(x + 200, 450);
    context.closePath();
    context.fill();
  }
  context.restore();

  context.save();
  for (const [index, building] of skyline.entries()) {
    const x = building.x - game.cameraX * 0.4;
    const y = 428 - building.height;
    if (x + building.width < -40 || x > canvas.width + 40) {
      continue;
    }

    const towerGradient = context.createLinearGradient(x, y, x, y + building.height);
    towerGradient.addColorStop(0, "rgba(20, 17, 44, 0.95)");
    towerGradient.addColorStop(1, "rgba(3, 7, 21, 0.98)");
    context.fillStyle = towerGradient;
    context.fillRect(x, y, building.width, building.height);
    context.fillStyle = "rgba(0, 246, 255, 0.14)";
    context.fillRect(x + building.width * 0.18, y - 10, 2, 10);

    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 5; row += 1) {
        if ((column + row + building.windowOffset) % 2 !== 0) {
          continue;
        }

        const windowColors = [
          "rgba(0, 246, 255, 0.46)",
          "rgba(255, 55, 227, 0.42)",
          "rgba(123, 97, 255, 0.44)",
        ];
        context.fillStyle = windowColors[(column + row + index) % windowColors.length];
        context.fillRect(
          x + 12 + column * 18,
          y + 16 + row * 22,
          7,
          10,
        );
      }
    }

    if (index % 3 === 0) {
      context.fillStyle = "rgba(255, 55, 227, 0.22)";
      context.fillRect(x + 10, y + 18, building.width - 20, 4);
    }
  }

  for (const [index, sign] of billboards.entries()) {
    const x = sign.x - game.cameraX * 0.38;
    if (x + sign.width < -40 || x > canvas.width + 40) {
      continue;
    }

    const glowColor = index % 2 === 0 ? "rgba(0, 246, 255, 0.55)" : "rgba(255, 55, 227, 0.55)";
    context.save();
    context.shadowColor = glowColor;
    context.shadowBlur = 22;
    context.fillStyle = "rgba(8, 12, 26, 0.94)";
    context.fillRect(x, sign.y, sign.width, sign.height);
    context.strokeStyle = glowColor;
    context.lineWidth = 2;
    context.strokeRect(x, sign.y, sign.width, sign.height);
    context.fillStyle = index % 2 === 0 ? "#00f6ff" : "#ff5ce2";
    context.font = "bold 18px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(sign.label, x + sign.width / 2, sign.y + sign.height / 2 + 1);
    context.restore();
  }
  context.restore();

  const horizonGlow = context.createLinearGradient(0, 230, 0, canvas.height);
  horizonGlow.addColorStop(0, "rgba(255, 55, 227, 0)");
  horizonGlow.addColorStop(0.5, "rgba(255, 55, 227, 0.1)");
  horizonGlow.addColorStop(1, "rgba(0, 246, 255, 0.24)");
  context.fillStyle = horizonGlow;
  context.fillRect(0, 230, canvas.width, canvas.height - 230);

  const fog = context.createLinearGradient(0, 350, 0, canvas.height);
  fog.addColorStop(0, "rgba(7, 8, 24, 0)");
  fog.addColorStop(1, "rgba(7, 8, 24, 0.56)");
  context.fillStyle = fog;
  context.fillRect(0, 350, canvas.width, canvas.height - 350);

  context.fillStyle = "rgba(0, 246, 255, 0.18)";
  context.fillRect(0, 434, canvas.width, 3);
  context.fillStyle = "rgba(255, 55, 227, 0.1)";
  for (let index = 0; index < canvas.width; index += 42) {
    context.fillRect(index, 438, 18, 2);
  }

  context.fillStyle = `rgba(255, 255, 255, ${0.014 + (Math.sin(animationTime * 2) + 1) * 0.008})`;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWorld() {
  const animationTime = getAnimationTime();

  context.save();
  context.translate(-game.cameraX, 0);

  for (const solid of solids) {
    const glowColor = solid.glow || solid.accent;
    const solidGradient = context.createLinearGradient(
      solid.x,
      solid.y,
      solid.x,
      solid.y + solid.height,
    );
    solidGradient.addColorStop(0, solid.accent);
    solidGradient.addColorStop(0.08, glowColor);
    solidGradient.addColorStop(0.15, solid.color);
    solidGradient.addColorStop(1, "#050811");

    context.save();
    context.shadowColor = glowColor;
    context.shadowBlur = solid.height > 30 ? 16 : 12;
    context.fillStyle = solidGradient;
    context.fillRect(solid.x, solid.y, solid.width, solid.height);
    context.restore();

    context.fillStyle = "rgba(255, 255, 255, 0.12)";
    context.fillRect(solid.x, solid.y, solid.width, 3);

    context.fillStyle = solid.accent;
    context.fillRect(solid.x + 8, solid.y + 5, solid.width - 16, 3);

    context.fillStyle = "rgba(255, 55, 227, 0.16)";
    context.fillRect(solid.x + 10, solid.y + 11, solid.width - 20, 2);

    context.fillStyle = "rgba(2, 6, 23, 0.45)";
    context.fillRect(solid.x + 6, solid.y + solid.height - 8, solid.width - 12, 6);

    context.fillStyle = "rgba(0, 246, 255, 0.08)";
    for (let stripX = solid.x + 16; stripX < solid.x + solid.width - 12; stripX += 28) {
      context.fillRect(stripX, solid.y + 8, 2, solid.height - 18);
    }
  }

  for (const hazard of hazards) {
    context.save();
    context.shadowColor = "rgba(255, 55, 227, 0.42)";
    context.shadowBlur = 20;
    context.fillStyle = "rgba(48, 8, 46, 0.54)";
    context.fillRect(hazard.x - 8, hazard.y + 8, hazard.width + 16, hazard.height);

    const spikeCount = Math.floor(hazard.width / 16);
    for (let index = 0; index < spikeCount; index += 1) {
      const spikeX = hazard.x + index * 16;
      const spikeGradient = context.createLinearGradient(
        spikeX,
        hazard.y,
        spikeX,
        hazard.y + hazard.height,
      );
      spikeGradient.addColorStop(0, "#00f6ff");
      spikeGradient.addColorStop(0.45, "#ff5ce2");
      spikeGradient.addColorStop(1, "#4b1247");
      context.fillStyle = spikeGradient;
      context.beginPath();
      context.moveTo(spikeX, hazard.y + hazard.height);
      context.lineTo(spikeX + 8, hazard.y);
      context.lineTo(spikeX + 16, hazard.y + hazard.height);
      context.closePath();
      context.fill();

      context.strokeStyle = "rgba(255, 255, 255, 0.45)";
      context.beginPath();
      context.moveTo(spikeX + 8, hazard.y + 3);
      context.lineTo(spikeX + 11, hazard.y + hazard.height - 3);
      context.stroke();
    }
    context.restore();
  }

  for (const item of collectibles) {
    if (item.collected) {
      continue;
    }

    const centerX = item.x + item.size / 2;
    const centerY = item.y + item.size / 2 - Math.sin(animationTime * 4 + item.x * 0.03) * 4;
    const pulse = 1 + Math.sin(animationTime * 6 + item.x * 0.05) * 0.16;

    context.save();
    context.shadowColor = "rgba(0, 246, 255, 0.42)";
    context.shadowBlur = 20;
    context.fillStyle = `rgba(0, 246, 255, ${0.18 * pulse})`;
    context.beginPath();
    context.arc(centerX, centerY, item.size * 0.92 * pulse, 0, Math.PI * 2);
    context.fill();

    const gemGradient = context.createLinearGradient(
      centerX,
      centerY - item.size / 2,
      centerX,
      centerY + item.size / 2,
    );
    gemGradient.addColorStop(0, "#00f6ff");
    gemGradient.addColorStop(0.5, "#9e8cff");
    gemGradient.addColorStop(1, "#ff5ce2");
    context.fillStyle = gemGradient;
    context.beginPath();
    context.moveTo(centerX, centerY - item.size / 2);
    context.lineTo(centerX + item.size / 2, centerY);
    context.lineTo(centerX, centerY + item.size / 2);
    context.lineTo(centerX - item.size / 2, centerY);
    context.closePath();
    context.fill();

    context.strokeStyle = "rgba(255, 255, 255, 0.65)";
    context.beginPath();
    context.moveTo(centerX, centerY - item.size / 2 - 6);
    context.lineTo(centerX, centerY + item.size / 2 + 6);
    context.moveTo(centerX - item.size / 2 - 6, centerY);
    context.lineTo(centerX + item.size / 2 + 6, centerY);
    context.stroke();
    context.restore();
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    const hoverOffset = Math.sin(animationTime * 5 + enemy.x * 0.02) * 1.5;
    const eyeX = enemy.facing > 0 ? enemy.x + 23 : enemy.x + 8;

    context.save();
    context.fillStyle = "rgba(2, 6, 23, 0.4)";
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

    context.shadowColor = "rgba(255, 55, 227, 0.35)";
    context.shadowBlur = 14;
    context.fillStyle = "#070d20";
    context.fillRect(enemy.x + 6, enemy.y + 16 + hoverOffset, enemy.width - 12, 18);

    const droneGradient = context.createLinearGradient(
      enemy.x,
      enemy.y + hoverOffset,
      enemy.x + enemy.width,
      enemy.y + enemy.height + hoverOffset,
    );
    droneGradient.addColorStop(0, "#00f6ff");
    droneGradient.addColorStop(0.5, "#7b61ff");
    droneGradient.addColorStop(1, "#ff5ce2");
    context.fillStyle = droneGradient;
    context.fillRect(enemy.x + 3, enemy.y + 8 + hoverOffset, enemy.width - 6, 10);
    context.fillRect(enemy.x, enemy.y + 20 + hoverOffset, enemy.width, 10);

    context.fillStyle = "#0d1329";
    context.fillRect(enemy.x + 4, enemy.y + 22 + hoverOffset, enemy.width - 8, 8);

    context.fillStyle = "#f8fbff";
    context.fillRect(enemy.x + 8, enemy.y + 10 + hoverOffset, enemy.width - 16, 4);

    context.fillStyle = "#ff5ce2";
    context.fillRect(enemy.x + 2, enemy.y + 30 + hoverOffset, 6, 6);
    context.fillRect(enemy.x + enemy.width - 8, enemy.y + 30 + hoverOffset, 6, 6);

    context.fillStyle = "#00f6ff";
    context.fillRect(enemy.x + enemy.width / 2 - 3, enemy.y + enemy.height - 7 + hoverOffset, 6, 7);
    context.fillStyle = "#020617";
    context.fillRect(eyeX, enemy.y + 23 + hoverOffset, 5, 4);
    context.restore();
  }

  context.save();
  context.shadowColor = "rgba(0, 246, 255, 0.48)";
  context.shadowBlur = 20;
  context.strokeStyle = "#00f6ff";
  context.lineWidth = 6;
  context.strokeRect(goal.x - 10, goal.y, 24, goal.height);
  context.strokeStyle = "rgba(255, 55, 227, 0.75)";
  context.lineWidth = 2;
  context.strokeRect(goal.x - 18, goal.y - 8, 40, goal.height + 16);
  context.fillStyle = "#00f6ff";
  context.fillRect(goal.x - 6, goal.y + goal.height - 20, 18, 20);
  const flagGradient = context.createLinearGradient(goal.x + 6, goal.y, goal.x + 92, goal.y + 42);
  flagGradient.addColorStop(0, "#ff5ce2");
  flagGradient.addColorStop(1, "#00f6ff");
  context.fillStyle = flagGradient;
  context.beginPath();
  context.moveTo(goal.x + 6, goal.y);
  context.lineTo(goal.x + 92, goal.y + 24);
  context.lineTo(goal.x + 6, goal.y + 50);
  context.closePath();
  context.fill();
  context.restore();

  const shadowWidth = 26 + Math.abs(player.vx) * 0.04;
  context.fillStyle = "rgba(2, 6, 23, 0.45)";
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

  context.save();
  if (Math.abs(player.vx) > 10) {
    const trailDirection = player.facing > 0 ? -1 : 1;
    context.fillStyle = "rgba(244, 114, 182, 0.75)";
    context.beginPath();
    context.moveTo(player.x + player.width / 2, player.y + 18);
    context.lineTo(
      player.x + player.width / 2 + trailDirection * (16 + Math.abs(player.vx) * 0.06),
      player.y + 24,
    );
    context.lineTo(player.x + player.width / 2, player.y + 30);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "#020617";
  context.fillRect(player.x - 2, player.y - 2, player.width + 4, player.height + 4);

  const armorGradient = context.createLinearGradient(
    player.x,
    player.y,
    player.x,
    player.y + player.height,
  );
  armorGradient.addColorStop(0, "#00f6ff");
  armorGradient.addColorStop(0.48, "#5c7cff");
  armorGradient.addColorStop(1, "#220d53");
  context.shadowColor = "rgba(0, 246, 255, 0.34)";
  context.shadowBlur = 18;
  context.fillStyle = armorGradient;
  context.fillRect(player.x, player.y, player.width, player.height);

  context.shadowBlur = 0;
  context.fillStyle = "#e3fcff";
  context.fillRect(player.x + 6, player.y + 6, player.width - 12, 8);

  context.fillStyle = "#0f172a";
  context.fillRect(player.x + 5, player.y + 20, player.width - 10, 20);

  const visorGradient = context.createLinearGradient(
    player.x + 4,
    player.y + 10,
    player.x + player.width - 4,
    player.y + 22,
  );
  visorGradient.addColorStop(0, "#ff9bf4");
  visorGradient.addColorStop(1, "#00f6ff");
  context.fillStyle = visorGradient;
  context.fillRect(player.x + 5, player.y + 12, player.width - 10, 8);

  context.fillStyle = "#ff5ce2";
  context.fillRect(player.x + 8, player.y + 28, player.width - 16, 5);

  context.fillStyle = "#00f6ff";
  context.fillRect(player.x + 9, player.y + 34, player.width - 18, 3);

  context.fillStyle = "#e2e8f0";
  context.fillRect(player.x + 5, player.y + player.height - 10, 8, 10);
  context.fillRect(player.x + player.width - 13, player.y + player.height - 10, 8, 10);

  context.fillStyle = "#020617";
  const eyeX = player.facing > 0 ? player.x + 22 : player.x + 8;
  context.fillRect(eyeX, player.y + 14, 4, 3);
  context.restore();

  context.restore();
}

function drawScreenFx() {
  const vignette = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    140,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.72,
  );
  vignette.addColorStop(0, "rgba(255, 255, 255, 0)");
  vignette.addColorStop(1, "rgba(1, 3, 12, 0.5)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const topGlow = context.createLinearGradient(0, 0, canvas.width, 0);
  topGlow.addColorStop(0, "rgba(255, 55, 227, 0.08)");
  topGlow.addColorStop(0.5, "rgba(0, 246, 255, 0.06)");
  topGlow.addColorStop(1, "rgba(123, 97, 255, 0.08)");
  context.fillStyle = topGlow;
  context.fillRect(0, 0, canvas.width, 12);

  context.fillStyle = "rgba(173, 184, 255, 0.06)";
  for (let y = 0; y < canvas.height; y += 4) {
    context.fillRect(0, y, canvas.width, 1);
  }

  context.fillStyle = "rgba(0, 246, 255, 0.04)";
  context.fillRect(0, 0, 4, canvas.height);
  context.fillStyle = "rgba(255, 55, 227, 0.04)";
  context.fillRect(canvas.width - 4, 0, 4, canvas.height);
}

function drawOverlay() {
  if (game.state === "playing") {
    return;
  }

  context.fillStyle = "rgba(2, 6, 23, 0.58)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (game.state === "gameover") {
    return;
  }

  context.textAlign = "center";
  context.shadowBlur = 20;
  context.shadowColor =
    game.state === "won" ? "rgba(103, 232, 249, 0.55)" : "rgba(251, 113, 133, 0.55)";
  context.fillStyle = "#f8fafc";
  context.font = "bold 44px sans-serif";
  context.fillText(
    game.state === "won" ? "ステージクリア" : "ゲームオーバー",
    canvas.width / 2,
    canvas.height / 2 - 24,
  );
  context.shadowBlur = 0;
  context.fillStyle = game.state === "won" ? "#67e8f9" : "#fb7185";
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
