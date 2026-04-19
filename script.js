const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const messageElement = document.getElementById("message");
const restartButton = document.getElementById("restartButton");

const world = {
  width: 3200,
  height: canvas.height,
  gravity: 1800,
};

const spawnPoint = { x: 80, y: 420 };
const player = {
  x: spawnPoint.x,
  y: spawnPoint.y,
  width: 34,
  height: 48,
  vx: 0,
  vy: 0,
  speed: 280,
  jumpForce: 620,
  onGround: false,
  facing: 1,
};

const game = {
  lives: 3,
  score: 0,
  state: "playing",
  cameraX: 0,
  message: "旗を目指して進もう！",
};

const keys = {
  left: false,
  right: false,
};

const solids = [
  { x: 0, y: 470, width: 420, height: 70, color: "#334155" },
  { x: 520, y: 470, width: 480, height: 70, color: "#334155" },
  { x: 1100, y: 470, width: 350, height: 70, color: "#334155" },
  { x: 1560, y: 470, width: 460, height: 70, color: "#334155" },
  { x: 2120, y: 470, width: 980, height: 70, color: "#334155" },
  { x: 290, y: 390, width: 130, height: 18, color: "#22c55e" },
  { x: 690, y: 360, width: 140, height: 18, color: "#22c55e" },
  { x: 880, y: 300, width: 110, height: 18, color: "#22c55e" },
  { x: 1210, y: 380, width: 130, height: 18, color: "#22c55e" },
  { x: 1680, y: 330, width: 120, height: 18, color: "#22c55e" },
  { x: 1870, y: 270, width: 120, height: 18, color: "#22c55e" },
  { x: 2230, y: 350, width: 160, height: 18, color: "#22c55e" },
  { x: 2520, y: 300, width: 120, height: 18, color: "#22c55e" },
  { x: 2760, y: 250, width: 140, height: 18, color: "#22c55e" },
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

function resetGame() {
  game.lives = 3;
  game.score = 0;
  game.state = "playing";
  game.message = "旗を目指して進もう！";
  game.cameraX = 0;

  for (const item of collectibles) {
    item.collected = false;
  }

  resetPlayerPosition();
  updateHud();
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
    game.message = `${reason} ゲームオーバー。Rキーかボタンで再挑戦。`;
    updateHud();
    return;
  }

  game.message = `${reason} 残りライフは ${game.lives}。`;
  resetPlayerPosition();
  updateHud();
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
  }
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

  player.vy += world.gravity * deltaTime;
  const previousY = player.y;
  player.y += player.vy * deltaTime;
  resolveVerticalCollisions(previousY);

  if (player.y > canvas.height + 160) {
    loseLife("穴に落ちた！");
    return;
  }

  for (const hazard of hazards) {
    if (intersects(player, hazard)) {
      loseLife("トゲに当たった！");
      return;
    }
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

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#0f172a");
  sky.addColorStop(0.55, "#1d4ed8");
  sky.addColorStop(1, "#38bdf8");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 6; i += 1) {
    const x = ((i * 220 - game.cameraX * 0.2) % (canvas.width + 280)) - 80;
    const y = 85 + (i % 2) * 40;
    context.fillStyle = "rgba(255, 255, 255, 0.78)";
    context.beginPath();
    context.arc(x, y, 28, 0, Math.PI * 2);
    context.arc(x + 30, y - 10, 22, 0, Math.PI * 2);
    context.arc(x + 54, y, 18, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "rgba(15, 23, 42, 0.35)";
  for (let i = 0; i < 9; i += 1) {
    const x = i * 180 - game.cameraX * 0.32;
    context.beginPath();
    context.moveTo(x, 420);
    context.lineTo(x + 120, 210);
    context.lineTo(x + 240, 420);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "rgba(14, 116, 144, 0.4)";
  context.fillRect(0, 420, canvas.width, 120);
}

function drawWorld() {
  context.save();
  context.translate(-game.cameraX, 0);

  for (const solid of solids) {
    context.fillStyle = solid.color;
    context.fillRect(solid.x, solid.y, solid.width, solid.height);
    context.fillStyle = "rgba(255, 255, 255, 0.12)";
    context.fillRect(solid.x, solid.y, solid.width, 4);
  }

  for (const hazard of hazards) {
    context.fillStyle = "#ef4444";
    const spikeCount = Math.floor(hazard.width / 16);
    for (let index = 0; index < spikeCount; index += 1) {
      const spikeX = hazard.x + index * 16;
      context.beginPath();
      context.moveTo(spikeX, hazard.y + hazard.height);
      context.lineTo(spikeX + 8, hazard.y);
      context.lineTo(spikeX + 16, hazard.y + hazard.height);
      context.closePath();
      context.fill();
    }
  }

  for (const item of collectibles) {
    if (item.collected) {
      continue;
    }

    const centerX = item.x + item.size / 2;
    const centerY = item.y + item.size / 2;
    context.fillStyle = "#fde047";
    context.beginPath();
    context.moveTo(centerX, item.y);
    context.lineTo(item.x + item.size, centerY);
    context.lineTo(centerX, item.y + item.size);
    context.lineTo(item.x, centerY);
    context.closePath();
    context.fill();
  }

  context.fillStyle = "#cbd5e1";
  context.fillRect(goal.x, goal.y, 6, goal.height);
  context.fillStyle = "#f97316";
  context.beginPath();
  context.moveTo(goal.x + 6, goal.y);
  context.lineTo(goal.x + 76, goal.y + 24);
  context.lineTo(goal.x + 6, goal.y + 48);
  context.closePath();
  context.fill();

  context.fillStyle = "#f8fafc";
  context.fillRect(player.x, player.y, player.width, player.height);
  context.fillStyle = "#38bdf8";
  context.fillRect(player.x + 6, player.y + 10, player.width - 12, 12);
  context.fillStyle = "#0f172a";
  const eyeX = player.facing > 0 ? player.x + 22 : player.x + 8;
  context.fillRect(eyeX, player.y + 18, 4, 4);

  context.restore();
}

function drawOverlay() {
  if (game.state === "playing") {
    return;
  }

  context.fillStyle = "rgba(2, 6, 23, 0.5)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f8fafc";
  context.textAlign = "center";
  context.font = "bold 42px sans-serif";
  context.fillText(
    game.state === "won" ? "Stage Clear!" : "Game Over",
    canvas.width / 2,
    canvas.height / 2 - 20,
  );
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
  drawOverlay();

  window.requestAnimationFrame(frame);
}

function handleKeyChange(isPressed, event) {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW"].includes(event.code)) {
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

updateHud();
window.requestAnimationFrame(frame);
