function drawGame() {

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ========================================================
  // BACKGROUND
  // ========================================================

  const sky = ctx.createLinearGradient(0, 0, 0, 540);

  sky.addColorStop(0, "#9de5ff");
  sky.addColorStop(1, "#eafcff");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 540);

  // Snowy mountains
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.lineTo(180, 150);
  ctx.lineTo(330, 350);
  ctx.lineTo(500, 130);
  ctx.lineTo(700, 350);
  ctx.lineTo(850, 160);
  ctx.lineTo(960, 330);
  ctx.lineTo(960, 465);
  ctx.lineTo(0, 465);
  ctx.closePath();
  ctx.fill();

  // Ice ground
  ctx.fillStyle = "#8ed8ef";
  ctx.fillRect(0, 465, 960, 75);

  // ========================================================
  // PLAYERS
  // ========================================================

  players.forEach(drawPenguin);

  // ========================================================
  // ENEMIES
  // ========================================================

  enemies.forEach(enemy => {

    if (enemy.hp <= 0) return;

    if (enemy.name === "SEAL") {
      drawSeal(enemy);
    }

    else if (enemy.name === "CRAB") {
      drawCrab(enemy);
    }

    else if (enemy.name === "YETI") {
      drawYeti(enemy);
    }

  });

  // ========================================================
  // BOSS
  // ========================================================

  if (
    boss &&
    boss.active &&
    boss.hp > 0
  ) {
    drawIceBoss(boss);
  }

  // ========================================================
  // ATTACK EFFECTS
  // ========================================================

  const p = players[0];

  if (!p) return;

  // Punch
  if (p.attack) {

    ctx.fillStyle = "#ffd84d";

    ctx.beginPath();

    ctx.arc(
      p.x + (p.face > 0 ? 70 : -30),
      p.y + 27,
      18,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#8a5a00";

    ctx.font = "bold 18px system-ui";

    ctx.fillText(
      "POW!",
      p.x + (p.face > 0 ? 55 : -55),
      p.y + 5
    );
  }

  // Gust
  if (p.gust) {

    ctx.strokeStyle = "#36a9d6";

    ctx.lineWidth = 6;

    for (let i = 0; i < 3; i++) {

      ctx.beginPath();

      ctx.arc(
        p.x + p.face * (55 + i * 18),
        p.y + 25,
        25 + i * 8,
        -0.8,
        0.8
      );

      ctx.stroke();
    }
  }
}


// ==========================================================
// SEAL
// ==========================================================

function drawSeal(enemy) {

  const x = enemy.x;
  const y = enemy.y;

  // Body
  ctx.fillStyle = "#687985";

  ctx.beginPath();

  ctx.ellipse(
    x + 24,
    y + 28,
    25,
    20,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Head
  ctx.fillStyle = "#7e909b";

  ctx.beginPath();

  ctx.arc(
    x + 24,
    y + 14,
    17,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Eyes
  ctx.fillStyle = "#111";

  ctx.beginPath();
  ctx.arc(x + 18, y + 11, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + 30, y + 11, 3, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = "#222";

  ctx.beginPath();

  ctx.arc(
    x + 24,
    y + 18,
    4,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Flippers
  ctx.strokeStyle = "#586a75";
  ctx.lineWidth = 7;

  ctx.beginPath();
  ctx.moveTo(x + 5, y + 28);
  ctx.lineTo(x - 10, y + 42);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 43, y + 28);
  ctx.lineTo(x + 58, y + 42);
  ctx.stroke();

  // Name
  ctx.fillStyle = "#173d4e";
  ctx.font = "bold 13px system-ui";

  ctx.fillText(
    "🦭 SEAL",
    x - 2,
    y - 10
  );

  drawEnemyHealth(enemy, 50);
}


// ==========================================================
// CRAB
// ==========================================================

function drawCrab(enemy) {

  const x = enemy.x;
  const y = enemy.y;

  // Body
  ctx.fillStyle = "#e34b42";

  ctx.beginPath();

  ctx.ellipse(
    x + 24,
    y + 28,
    24,
    17,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Eyes
  ctx.fillStyle = "#fff";

  ctx.beginPath();
  ctx.arc(x + 15, y + 10, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + 33, y + 10, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111";

  ctx.beginPath();
  ctx.arc(x + 15, y + 10, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + 33, y + 10, 3, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = "#c83c36";
  ctx.lineWidth = 5;

  for (let i = 0; i < 3; i++) {

    ctx.beginPath();

    ctx.moveTo(
      x + 8,
      y + 32 + i * 5
    );

    ctx.lineTo(
      x - 8,
      y + 38 + i * 5
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
      x + 40,
      y + 32 + i * 5
    );

    ctx.lineTo(
      x + 56,
      y + 38 + i * 5
    );

    ctx.stroke();
  }

  // Claws
  ctx.strokeStyle = "#b82f2b";
  ctx.lineWidth = 7;

  ctx.beginPath();
  ctx.moveTo(x - 3, y + 20);
  ctx.lineTo(x - 22, y + 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 51, y + 20);
  ctx.lineTo(x + 70, y + 8);
  ctx.stroke();

  ctx.fillStyle = "#173d4e";
  ctx.font = "bold 13px system-ui";

  ctx.fillText(
    "🦀 CRAB",
    x - 2,
    y - 10
  );

  drawEnemyHealth(enemy, 50);
}


// ==========================================================
// YETI
// ==========================================================

function drawYeti(enemy) {

  const x = enemy.x;
  const y = enemy.y;

  // Body
  ctx.fillStyle = "#eef7fa";

  ctx.beginPath();

  ctx.ellipse(
    x + 25,
    y + 35,
    28,
    32,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Head
  ctx.beginPath();

  ctx.arc(
    x + 25,
    y + 8,
    23,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Ears
  ctx.beginPath();

  ctx.arc(
    x + 5,
    y - 4,
    9,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.beginPath();

  ctx.arc(
    x + 45,
    y - 4,
    9,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Eyes
  ctx.fillStyle = "#222";

  ctx.beginPath();
  ctx.arc(x + 17, y + 6, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + 33, y + 6, 4, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.arc(
    x + 25,
    y + 14,
    8,
    0,
    Math.PI
  );

  ctx.stroke();

  // Arms
  ctx.strokeStyle = "#d5e6ec";
  ctx.lineWidth = 12;

  ctx.beginPath();

  ctx.moveTo(x + 4, y + 30);
  ctx.lineTo(x - 15, y + 52);

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(x + 46, y + 30);
  ctx.lineTo(x + 65, y + 52);

  ctx.stroke();

  ctx.fillStyle = "#173d4e";
  ctx.font = "bold 13px system-ui";

  ctx.fillText(
    "👹 YETI",
    x + 3,
    y - 22
  );

  drawEnemyHealth(enemy, 60);
}


// ==========================================================
// ENEMY HEALTH BAR
// ==========================================================

function drawEnemyHealth(enemy, width) {

  const maxHp =
    enemy.name === "SEAL"
      ? 2
      : enemy.name === "CRAB"
        ? 3
        : 4;

  ctx.fillStyle = "#333";

  ctx.fillRect(
    enemy.x,
    enemy.y - 5,
    width,
    5
  );

  ctx.fillStyle = "#40c463";

  ctx.fillRect(
    enemy.x,
    enemy.y - 5,
    width * Math.max(
      0,
      enemy.hp / maxHp
    ),
    5
  );
}


// ==========================================================
// ICE BOSS
// ==========================================================

function drawIceBoss(boss) {

  const x = boss.x;
  const y = boss.y;

  // Body
  ctx.fillStyle = "#667b91";

  ctx.beginPath();

  ctx.ellipse(
    x + 40,
    y + 55,
    42,
    50,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Head
  ctx.fillStyle = "#8298aa";

  ctx.beginPath();

  ctx.arc(
    x + 40,
    y + 20,
    34,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Crown
  ctx.fillStyle = "#ffd43b";

  ctx.beginPath();

  ctx.moveTo(x + 10, y - 7);
  ctx.lineTo(x + 17, y - 35);
  ctx.lineTo(x + 30, y - 15);
  ctx.lineTo(x + 40, y - 40);
  ctx.lineTo(x + 51, y - 15);
  ctx.lineTo(x + 67, y - 35);
  ctx.lineTo(x + 70, y - 7);

  ctx.closePath();

  ctx.fill();

  // Eyes
  ctx.fillStyle = "#ff4040";

  ctx.beginPath();
  ctx.arc(x + 27, y + 17, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + 53, y + 17, 6, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.fillStyle = "#202b35";

  ctx.beginPath();

  ctx.arc(
    x + 40,
    y + 37,
    13,
    0,
    Math.PI
  );

  ctx.fill();

  // Arms
  ctx.strokeStyle = "#536979";
  ctx.lineWidth = 15;

  ctx.beginPath();

  ctx.moveTo(x + 8, y + 55);
  ctx.lineTo(x - 25, y + 85);

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(x + 72, y + 55);
  ctx.lineTo(x + 105, y + 85);

  ctx.stroke();

  // Boss name
  ctx.fillStyle = "#173d4e";

  ctx.font =
    "bold 16px system-ui";

  ctx.fillText(
    "👑 ICE BOSS",
    x + 4,
    y - 48
  );

  // Boss health bar
  const barWidth = 100;

  ctx.fillStyle = "#333";

  ctx.fillRect(
    x - 10,
    y - 62,
    barWidth,
    9
  );

  ctx.fillStyle = "#e33";

  ctx.fillRect(
    x - 10,
    y - 62,
    barWidth *
      Math.max(
        0,
        boss.hp / boss.max
      ),
    9
  );
}
