// ============================================================
// 🐧 PENGUIN ADVENTURE
// Complete browser game controller
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

const menu = document.getElementById("menu");
const gameWrap = document.getElementById("gameWrap");
const screen = document.getElementById("screen");

const friendsBtn = document.getElementById("friendsBtn");
const friendsPanel = document.getElementById("friendsPanel");
const closeFriends = document.getElementById("closeFriends");

const toast = document.getElementById("toast");
const hpDisplay = document.getElementById("hp");
const modeDisplay = document.getElementById("mode");
const coinsDisplay = document.getElementById("coins");

let currentMode = "menu";
let animationId = null;

let coins = Number(
  localStorage.getItem("penguinCoins") || 0
);

// ============================================================
// PLAYER
// ============================================================

const player = {
  x: 180,
  y: 390,
  width: 42,
  height: 55,

  vx: 0,
  vy: 0,

  speed: 4.5,
  jumpPower: 11,

  hp: 5,
  maxHp: 5,

  grounded: false,

  facing: 1,

  attackTimer: 0,
  gustTimer: 0
};


// ============================================================
// GAME STATE
// ============================================================

let enemies = [];
let particles = [];

const keys = {};

let lastTime = 0;


// ============================================================
// SIMPLE ENEMY TYPES
// ============================================================

function createEnemy(type, x, y) {

  const stats = {
    SEAL: {
      hp: 2,
      speed: 1.2,
      width: 52,
      height: 45
    },

    CRAB: {
      hp: 3,
      speed: 1.5,
      width: 55,
      height: 42
    },

    YETI: {
      hp: 5,
      speed: 0.8,
      width: 60,
      height: 70
    }
  };

  const s = stats[type];

  return {
    name: type,

    x,
    y,

    width: s.width,
    height: s.height,

    hp: s.hp,
    maxHp: s.hp,

    speed: s.speed,

    direction: -1,

    hitTimer: 0
  };
}


// ============================================================
// START LEVEL
// ============================================================

function startAdventure() {

  currentMode = "adventure";

  player.x = 160;
  player.y = 380;
  player.vx = 0;
  player.vy = 0;

  player.hp = player.maxHp;

  enemies = [
    createEnemy("SEAL", 520, 420),
    createEnemy("CRAB", 700, 425),
    createEnemy("YETI", 840, 370)
  ];

  openGame("Adventure");

  showToast("🐧 Adventure started!");

  startLoop();
}


// ============================================================
// OPEN GAME
// ============================================================

function openGame(mode) {

  currentMode = mode;

  menu.classList.add("hidden");
  screen.classList.add("hidden");
  gameWrap.classList.remove("hidden");

  if (modeDisplay) {
    modeDisplay.textContent = mode;
  }

  updateHUD();
}


// ============================================================
// RETURN TO MENU
// ============================================================

function returnToMenu() {

  currentMode = "menu";

  gameWrap.classList.add("hidden");
  screen.classList.add("hidden");
  menu.classList.remove("hidden");

  stopLoop();
}


// ============================================================
// CO-OP
// ============================================================

function openCoop() {

  currentMode = "coop";

  menu.classList.add("hidden");
  gameWrap.classList.add("hidden");
  screen.classList.remove("hidden");

  screen.innerHTML = `
    <h2>👥 Co-op</h2>

    <p>Play with up to 4 penguins.</p>

    <button class="big" id="hostParty">
      🏠 Host Party
    </button>

    <button class="big" id="joinParty">
      🔑 Join Party
    </button>

    <button class="big" id="coopBack">
      ← Back
    </button>
  `;

  document.getElementById("hostParty")
    .addEventListener("click", hostParty);

  document.getElementById("joinParty")
    .addEventListener("click", joinParty);

  document.getElementById("coopBack")
    .addEventListener("click", returnToMenu);
}


function hostParty() {

  const code =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  screen.innerHTML = `
    <h2>🏠 Party Created!</h2>

    <p>Give this code to your friends:</p>

    <div class="party-code">
      ${code}
    </div>

    <p>
      Up to 4 penguins can join.
    </p>

    <button class="big" id="startParty">
      🐧 Start Co-op
    </button>

    <button class="big" id="coopBack">
      ← Back
    </button>
  `;

  document.getElementById("startParty")
    .addEventListener("click", () => {

      startAdventure();

      currentMode = "coop";

      if (modeDisplay) {
        modeDisplay.textContent = "Co-op";
      }

      showToast(
        "👥 Party started!"
      );
    });

  document.getElementById("coopBack")
    .addEventListener("click", returnToMenu);
}


function joinParty() {

  screen.innerHTML = `
    <h2>🔑 Join Party</h2>

    <p>Enter your friend's party code.</p>

    <input
      id="partyCodeInput"
      maxlength="6"
      placeholder="ABC123"
      style="text-transform:uppercase;"
    >

    <br>

    <button class="big" id="joinPartyConfirm">
      Join
    </button>

    <button class="big" id="coopBack">
      ← Back
    </button>
  `;

  document.getElementById("joinPartyConfirm")
    .addEventListener("click", () => {

      const input =
        document.getElementById(
          "partyCodeInput"
        );

      if (!input.value.trim()) {

        showToast(
          "Enter a party code first."
        );

        return;
      }

      startAdventure();

      currentMode = "coop";

      if (modeDisplay) {
        modeDisplay.textContent = "Co-op";
      }

      showToast(
        "👥 Joined party!"
      );
    });

  document.getElementById("coopBack")
    .addEventListener("click", returnToMenu);
}


// ============================================================
// PVP
// ============================================================

function openPVP() {

  menu.classList.add("hidden");
  screen.classList.remove("hidden");

  screen.innerHTML = `
    <h2>⚔️ PVP</h2>

    <button class="big" id="duel">
      ⚔️ Penguin Duel
    </button>

    <button class="big" id="freeForAll">
      🐧 Mega Free For All
    </button>

    <p>
      Mega Free For All supports up to 10 penguins.
    </p>

    <button class="big" id="pvpBack">
      ← Back
    </button>
  `;

  document.getElementById("duel")
    .addEventListener("click", () => {

      showToast(
        "⚔️ Duel mode selected!"
      );

      startAdventure();

      currentMode = "PVP";

      modeDisplay.textContent = "PVP";
    });

  document.getElementById("freeForAll")
    .addEventListener("click", () => {

      showToast(
        "🐧 Mega Free For All selected!"
      );

      startAdventure();

      currentMode = "Mega FFA";

      modeDisplay.textContent =
        "Mega FFA";
    });

  document.getElementById("pvpBack")
    .addEventListener("click", returnToMenu);
}


// ============================================================
// LEVEL CREATOR
// ============================================================

function openCreator() {

  menu.classList.add("hidden");
  screen.classList.remove("hidden");

  screen.innerHTML = `
    <h2>🛠️ Level Creator</h2>

    <p>Choose an object to place.</p>

    <div class="creatorGrid">

      <button data-tool="ice">
        🧊 Ice
      </button>

      <button data-tool="snow">
        ❄️ Snow
      </button>

      <button data-tool="seal">
        🦭 Seal
      </button>

      <button data-tool="crab">
        🦀 Crab
      </button>

      <button data-tool="yeti">
        👹 Yeti
      </button>

      <button data-tool="coin">
        🪙 Coin
      </button>

      <button data-tool="spike">
        🔺 Spike
      </button>

      <button data-tool="goal">
        🏁 Goal
      </button>

    </div>

    <button class="big" id="creatorBack">
      ← Back
    </button>
  `;

  document
    .querySelectorAll("[data-tool]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          showToast(
            "🛠️ Selected " +
            button.dataset.tool
          );
        }
      );
    });

  document.getElementById("creatorBack")
    .addEventListener("click", returnToMenu);
}


// ============================================================
// SHOP
// ============================================================

function openShop() {

  menu.classList.add("hidden");
  screen.classList.remove("hidden");

  screen.innerHTML = `
    <h2>🛍️ Penguin Shop</h2>

    <p id="shopCoins">
      🪙 Coins: ${coins}
    </p>

    <button class="big" id="buyGoggles">
      🥽 Ice Goggles — 25 coins
    </button>

    <button class="big" id="buyCape">
      🧣 Snow Cape — 50 coins
    </button>

    <button class="big" id="buyHammer">
      🔨 Ice Hammer — 75 coins
    </button>

    <button class="big" id="shopBack">
      ← Back
    </button>
  `;

  document.getElementById("buyGoggles")
    .addEventListener(
      "click",
      () => buyItem("Ice Goggles", 25)
    );

  document.getElementById("buyCape")
    .addEventListener(
      "click",
      () => buyItem("Snow Cape", 50)
    );

  document.getElementById("buyHammer")
    .addEventListener(
      "click",
      () => buyItem("Ice Hammer", 75)
    );

  document.getElementById("shopBack")
    .addEventListener(
      "click",
      returnToMenu
    );
}


function buyItem(name, price) {

  if (coins < price) {

    showToast(
      "❌ Not enough coins!"
    );

    return;
  }

  coins -= price;

  localStorage.setItem(
    "penguinCoins",
    coins
  );

  showToast(
    "🎉 Bought " + name + "!"
  );

  openShop();
}


// ============================================================
// FRIENDS
// ============================================================

function openFriends() {

  friendsPanel.classList.remove("hidden");

  const list =
    document.getElementById(
      "friendsList"
    );

  if (!list) return;

  list.innerHTML = `
    <div class="friend">
      <span>
        🐧 Your Player
      </span>

      <span class="online">
        ● Online
      </span>
    </div>

    <div class="friend">
      <span>
        No friends added yet
      </span>
    </div>

    <button
      class="big"
      id="addFriendButton"
    >
      ➕ Add Friend
    </button>
  `;

  document
    .getElementById("addFriendButton")
    .addEventListener(
      "click",
      addFriend
    );
}


function addFriend() {

  const code =
    prompt(
      "Enter your friend's player code:"
    );

  if (!code) return;

  showToast(
    "📩 Friend request sent!"
  );
}


// ============================================================
// BUTTON CONNECTIONS
// ============================================================

document
  .querySelectorAll("[data-screen]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const target =
          button.dataset.screen;

        if (target === "adventure") {
          startAdventure();
        }

        if (target === "coop") {
          openCoop();
        }

        if (target === "pvp") {
          openPVP();
        }

        if (target === "creator") {
          openCreator();
        }
      }
    );
  });


if (friendsBtn) {

  friendsBtn.addEventListener(
    "click",
    openFriends
  );
}


if (closeFriends) {

  closeFriends.addEventListener(
    "click",
    () => {
      friendsPanel.classList.add(
        "hidden"
      );
    }
  );
}


const shopButton =
  document.getElementById("shopBtn");

if (shopButton) {

  shopButton.addEventListener(
    "click",
    openShop
  );
}


// ============================================================
// GAME CONTROLS
// ============================================================

const leftButton =
  document.querySelector(
    '[data-key="left"]'
  );

const rightButton =
  document.querySelector(
    '[data-key="right"]'
  );

function holdKey(key) {

  keys[key] = true;
}


function releaseKey(key) {

  keys[key] = false;
}


if (leftButton) {

  leftButton.addEventListener(
    "pointerdown",
    () => holdKey("ArrowLeft")
  );

  leftButton.addEventListener(
    "pointerup",
    () => releaseKey("ArrowLeft")
  );

  leftButton.addEventListener(
    "pointercancel",
    () => releaseKey("ArrowLeft")
  );
}


if (rightButton) {

  rightButton.addEventListener(
    "pointerdown",
    () => holdKey("ArrowRight")
  );

  rightButton.addEventListener(
    "pointerup",
    () => releaseKey("ArrowRight")
  );

  rightButton.addEventListener(
    "pointercancel",
    () => releaseKey("ArrowRight")
  );
}


document.addEventListener(
  "keydown",
  event => {

    keys[event.key] = true;

    if (
      event.key === " " ||
      event.key === "ArrowUp"
    ) {
      jump();
    }

    if (
      event.key.toLowerCase() === "f"
    ) {
      punch();
    }

    if (
      event.key.toLowerCase() === "g"
    ) {
      gust();
    }
  }
);


document.addEventListener(
  "keyup",
  event => {

    keys[event.key] = false;
  }
);


// ============================================================
// JUMP
// ============================================================

function jump() {

  if (
    currentMode === "menu" ||
    currentMode === "coop" ||
    !player.grounded
  ) {
    return;
  }

  player.vy =
    -player.jumpPower;

  player.grounded = false;
}


// ============================================================
// PUNCH
// ============================================================

function punch() {

  if (
    gameWrap.classList.contains("hidden")
  ) {
    return;
  }

  player.attackTimer = 15;

  const attackX =
    player.x +
    player.facing * 60;

  enemies.forEach(enemy => {

    if (
      Math.abs(
        enemy.x - attackX
      ) < 55 &&
      Math.abs(
        enemy.y - player.y
      ) < 60
    ) {

      enemy.hp--;

      enemy.hitTimer = 10;

      if (enemy.hp <= 0) {

        coins += 5;

        localStorage.setItem(
          "penguinCoins",
          coins
        );

        showToast(
          "💥 Enemy defeated! +5 coins"
        );
      }
    }
  });
}


// ============================================================
// GUST
// ============================================================

function gust() {

  if (
    gameWrap.classList.contains("hidden")
  ) {
    return;
  }

  player.gustTimer = 20;

  enemies.forEach(enemy => {

    const distance =
      Math.abs(
        enemy.x - player.x
      );

    if (distance < 150) {

      enemy.hp--;

      if (enemy.hp <= 0) {

        coins += 5;

        localStorage.setItem(
          "penguinCoins",
          coins
        );
      }
    }
  });
}


// ============================================================
// MOBILE ATTACK BUTTONS
// ============================================================

const jumpButton =
  document.getElementById("jump");

const punchButton =
  document.getElementById("punch");

const gustButton =
  document.getElementById("gust");

const leaveButton =
  document.getElementById("leaveGame");


if (jumpButton) {

  jumpButton.addEventListener(
    "pointerdown",
    jump
  );
}


if (punchButton) {

  punchButton.addEventListener(
    "pointerdown",
    punch
  );
}


if (gustButton) {

  gustButton.addEventListener(
    "pointerdown",
    gust
  );
}


if (leaveButton) {

  leaveButton.addEventListener(
    "click",
    returnToMenu
  );
}


// ============================================================
// PHYSICS
// ============================================================

function updatePlayer() {

  if (keys["ArrowLeft"]) {

    player.vx = -player.speed;

    player.facing = -1;

  } else if (keys["ArrowRight"]) {

    player.vx = player.speed;

    player.facing = 1;

  } else {

    player.vx *= 0.8;
  }

  player.x += player.vx;

  player.vy += 0.5;

  player.y += player.vy;


  const groundY =
    465 - player.height;

  if (player.y >= groundY) {

    player.y = groundY;

    player.vy = 0;

    player.grounded = true;
  }


  if (player.x < 0) {
    player.x = 0;
  }

  if (
    player.x >
    canvas.width - player.width
  ) {
    player.x =
      canvas.width -
      player.width;
  }


  if (player.attackTimer > 0) {
    player.attackTimer--;
  }

  if (player.gustTimer > 0) {
    player.gustTimer--;
  }
}


// ============================================================
// ENEMY AI
// ============================================================

function updateEnemies() {

  enemies.forEach(enemy => {

    if (enemy.hp <= 0) {
      return;
    }

    const distance =
      player.x - enemy.x;

    if (
      Math.abs(distance) < 300
    ) {

      enemy.direction =
        distance > 0
          ? 1
          : -1;

      enemy.x +=
        enemy.direction *
        enemy.speed;
    }

    if (enemy.hitTimer > 0) {
      enemy.hitTimer--;
    }

    // Simple enemy collision
    if (
      Math.abs(
        player.x - enemy.x
      ) < 38 &&
      Math.abs(
        player.y - enemy.y
      ) < 45
    ) {

      if (
        enemy.hitTimer === 0
      ) {

        player.hp--;

        enemy.hitTimer = 45;

        updateHUD();

        if (player.hp <= 0) {

          player.hp =
            player.maxHp;

          player.x = 150;

          showToast(
            "💫 You were defeated!"
          );
        }
      }
    }
  });

  enemies =
    enemies.filter(
      enemy => enemy.hp > 0
    );
}


// ============================================================
// DRAW
// ============================================================

function drawGame() {

  if (!ctx) return;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  // Sky
  const sky =
    ctx.createLinearGradient(
      0,
      0,
      0,
      canvas.height
    );

  sky.addColorStop(
    0,
    "#9de5ff"
  );

  sky.addColorStop(
    1,
    "#eafcff"
  );

  ctx.fillStyle = sky;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  // Mountains
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


  // Ground
  ctx.fillStyle = "#8ed8ef";

  ctx.fillRect(
    0,
    465,
    960,
    75
  );


  // Enemies
  enemies.forEach(
    drawEnemy
  );


  // Player
  drawPenguin(
    player.x,
    player.y
  );


  // Attack effects
  if (player.attackTimer > 0) {

    ctx.fillStyle = "#ffd84d";

    ctx.beginPath();

    ctx.arc(
      player.x +
        player.facing * 55,
      player.y + 25,
      17,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#704900";

    ctx.font =
      "bold 17px system-ui";

    ctx.fillText(
      "POW!",
      player.x +
        player.facing * 50,
      player.y
    );
  }


  if (player.gustTimer > 0) {

    ctx.strokeStyle =
      "#36a9d6";

    ctx.lineWidth = 5;

    for (
      let i = 0;
      i < 3;
      i++
    ) {

      ctx.beginPath();

      ctx.arc(
        player.x +
          player.facing *
          (55 + i * 20),
        player.y + 25,
        20 + i * 8,
        -0.8,
        0.8
      );

      ctx.stroke();
    }
  }
}


// ============================================================
// PENGUIN DRAWING
// ============================================================

function drawPenguin(x, y) {

  // Body
  ctx.fillStyle = "#263746";

  ctx.beginPath();

  ctx.ellipse(
    x + 21,
    y + 32,
    22,
    28,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Belly
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();

  ctx.ellipse(
    x + 21,
    y + 36,
    14,
    20,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Head
  ctx.fillStyle = "#263746";

  ctx.beginPath();

  ctx.arc(
    x + 21,
    y + 9,
    18,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Face
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();

  ctx.arc(
    x + 21,
    y + 11,
    12,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Eyes
  ctx.fillStyle = "#111";

  ctx.beginPath();

  ctx.arc(
    x + 16,
    y + 8,
    2.5,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.beginPath();

  ctx.arc(
    x + 26,
    y + 8,
    2.5,
    0,
    Math.PI * 2
  );

  ctx.fill();


  // Beak
  ctx.fillStyle = "#ffad2f";

  ctx.beginPath();

  ctx.moveTo(
    x + 21,
    y + 12
  );

  ctx.lineTo(
    x + 34,
    y + 16
  );

  ctx.lineTo(
    x + 21,
    y + 19
  );

  ctx.closePath();

  ctx.fill();


  // Feet
  ctx.fillStyle = "#ffad2f";

  ctx.beginPath();

  ctx.ellipse(
    x + 11,
    y + 58,
    10,
    5,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.beginPath();

  ctx.ellipse(
    x + 31,
    y + 58,
    10,
    5,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


// ============================================================
// ENEMY DRAWING
// ============================================================

function drawEnemy(enemy) {

  const x = enemy.x;
  const y = enemy.y;


  if (enemy.name === "SEAL") {

    ctx.fillStyle = "#697d88";

    ctx.beginPath();

    ctx.ellipse(
      x + 25,
      y + 25,
      25,
      18,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#8fa2ab";

    ctx.beginPath();

    ctx.arc(
      x + 25,
      y + 10,
      16,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.arc(
      x + 19,
      y + 8,
      3,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
      x + 31,
      y + 8,
      3,
      0,
      Math.PI * 2
    );

    ctx.fill();

  } else if (enemy.name === "CRAB") {

    ctx.fillStyle = "#df4d45";

    ctx.beginPath();

    ctx.ellipse(
      x + 27,
      y + 25,
      26,
      17,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#c23b36";

    ctx.lineWidth = 5;

    for (
      let i = 0;
      i < 3;
      i++
    ) {

      ctx.beginPath();

      ctx.moveTo(
        x + 10,
        y + 30 + i * 5
      );

      ctx.lineTo(
        x - 5,
        y + 40 + i * 5
      );

      ctx.stroke();

      ctx.beginPath();

      ctx.moveTo(
        x + 44,
        y + 30 + i * 5
      );

      ctx.lineTo(
        x + 59,
        y + 40 + i * 5
      );

      ctx.stroke();
    }

  } else {

    // Yeti
    ctx.fillStyle = "#edf7fa";

    ctx.beginPath();

    ctx.ellipse(
      x + 30,
      y + 40,
      28,
      35,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
      x + 30,
      y + 8,
      22,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#222";

    ctx.beginPath();

    ctx.arc(
      x + 22,
      y + 6,
      4,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
      x + 38,
      y + 6,
      4,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  // Enemy health bar
  const barWidth = enemy.width;

  ctx.fillStyle = "#333";

  ctx.fillRect(
    x,
    y - 10,
    barWidth,
    5
  );

  ctx.fillStyle = "#45c768";

  ctx.fillRect(
    x,
    y - 10,
    barWidth *
      Math.max(
        0,
        enemy.hp /
          enemy.maxHp
      ),
    5
  );
}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

  if (hpDisplay) {

    hpDisplay.textContent =
      "❤️ " +
      player.hp +
      "/" +
      player.maxHp;
  }

  if (coinsDisplay) {

    coinsDisplay.textContent =
      "Coins: " +
      coins;
  }
}


// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(time) {

  const delta =
    Math.min(
      32,
      time - lastTime
    );

  lastTime = time;

  if (
    !gameWrap.classList.contains(
      "hidden"
    )
  ) {

    updatePlayer();

    updateEnemies();

    drawGame();

    updateHUD();
  }

  animationId =
    requestAnimationFrame(
      gameLoop
    );
}


function startLoop() {

  if (animationId === null) {

    lastTime =
      performance.now();

    animationId =
      requestAnimationFrame(
        gameLoop
      );
  }
}


function stopLoop() {

  if (animationId !== null) {

    cancelAnimationFrame(
      animationId
    );

    animationId = null;
  }
}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

  if (!toast) return;

  toast.textContent = message;

  toast.style.display = "block";

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {
        toast.style.display =
          "none";
      },
      2200
    );
}


// ============================================================
// START
// ============================================================

updateHUD();

console.log(
  "🐧 Penguin Adventure loaded successfully!"
);