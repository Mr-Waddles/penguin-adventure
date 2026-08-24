// ============================================================
// PENGUIN ADVENTURE - game.js
// ============================================================

const $ = (id) => document.getElementById(id);

const canvas = $("game");
const ctx = canvas ? canvas.getContext("2d") : null;

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------

let running = false;
let frame = 0;

let left = false;
let right = false;

let mode = "";
let coins = Number(localStorage.getItem("coins") || 0);

let players = [];
let enemies = [];
let boss = null;

let lastActivity = Date.now();
let idleTimer = null;

const MAX_PARTY_SIZE = 4;
const DISCONNECT_GRACE_MS = 5 * 60 * 1000;
const DEFEAT_SPECTATE_MS = 60 * 1000;

// ------------------------------------------------------------
// FRIENDS
// ------------------------------------------------------------

const friends = [
  { name: "Snowy", online: true },
  { name: "IceDash", online: true },
  { name: "Flipper", online: false },
  { name: "PenguinPro", online: true }
];

function renderFriends() {
  const list = $("friendsList");
  const count = $("onlineCount");

  if (!list) return;

  const online = friends.filter(f => f.online).length;

  if (count) {
    count.textContent = online;
  }

  list.innerHTML = friends.map(friend => `
    <div class="friend ${friend.online ? "online" : "offline"}">
      ● ${friend.name}
      — ${friend.online ? "Online" : "Offline"}
      ${friend.online
        ? `<button onclick="inviteFriend('${friend.name}')">Invite</button>`
        : ""}
    </div>
  `).join("");
}

function inviteFriend(name) {
  toast("Invitation sent to " + name);
}

if ($("friendsBtn")) {
  $("friendsBtn").onclick = () => {
    $("friendsPanel")?.classList.remove("hidden");
    renderFriends();
  };
}

if ($("closeFriends")) {
  $("closeFriends").onclick = () => {
    $("friendsPanel")?.classList.add("hidden");
  };
}

// ------------------------------------------------------------
// AWAY / IDLE SYSTEM
// ------------------------------------------------------------

function registerActivity() {
  lastActivity = Date.now();

  if (localStorage.getItem("penguinStatus") === "away") {
    localStorage.setItem("penguinStatus", "online");
    toast("🟢 You are back online!");
  }
}

function checkIdleStatus() {
  const elapsed = Date.now() - lastActivity;

  if (elapsed >= 5 * 60 * 1000) {
    if (localStorage.getItem("penguinStatus") !== "away") {
      localStorage.setItem("penguinStatus", "away");

      if (running) {
        toast("💤 You are now Away");
      }
    }
  }
}

setInterval(checkIdleStatus, 5000);

[
  "pointerdown",
  "pointermove",
  "keydown",
  "click",
  "touchstart"
].forEach(eventName => {
  document.addEventListener(eventName, registerActivity);
});

localStorage.setItem("penguinStatus", "online");

// ------------------------------------------------------------
// TOAST NOTIFICATIONS
// ------------------------------------------------------------

function toast(message) {
  const element = $("toast");

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;
  element.style.display = "block";

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    element.style.display = "none";
  }, 2500);
}

// ------------------------------------------------------------
// MENU
// ------------------------------------------------------------

function backToMenu() {
  running = false;

  $("screen")?.classList.add("hidden");
  $("gameWrap")?.classList.add("hidden");
  $("menu")?.classList.remove("hidden");
}

document.querySelectorAll("[data-screen]").forEach(button => {
  button.addEventListener("click", () => {

    const screen = button.dataset.screen;

    if (screen === "adventure") {
      startGame("Adventure");
    }

    if (screen === "coop") {
      showCoopMenu();
    }

    if (screen === "pvp") {
      showPvpMenu();
    }

    if (screen === "creator") {
      showLevelCreator();
    }
  });
});

// ------------------------------------------------------------
// SHOP
// ------------------------------------------------------------

if ($("shopBtn")) {
  $("shopBtn").onclick = () => {

    showScreen(`
      <h2>🛍️ Penguin Shop</h2>

      <p>Coins: ${coins}</p>

      <button onclick="buyUpgrade('boots', 15)">
        🥾 Ice Boots — 15 coins
      </button>

      <button onclick="buyUpgrade('gust', 25)">
        💨 Gust Gloves — 25 coins
      </button>

      <button onclick="buyUpgrade('armor', 35)">
        🛡️ Snow Armor — 35 coins
      </button>

      <br>

      <button onclick="backToMenu()">Back</button>
    `);
  };
}

function buyUpgrade(name, price) {

  if (localStorage.getItem("upgrade_" + name)) {
    toast("Already owned!");
    return;
  }

  if (coins < price) {
    toast("Not enough coins!");
    return;
  }

  coins -= price;

  localStorage.coins = coins;
  localStorage.setItem("upgrade_" + name, "true");

  toast("✅ Upgrade purchased!");
}

// ------------------------------------------------------------
// SCREEN SYSTEM
// ------------------------------------------------------------

function showScreen(html) {

  $("menu")?.classList.add("hidden");

  const screen = $("screen");

  if (!screen) return;

  screen.classList.remove("hidden");
  screen.innerHTML = html;
}

// ------------------------------------------------------------
// CO-OP
// ------------------------------------------------------------

function showCoopMenu() {

  showScreen(`
    <h2>👥 Penguin Co-op</h2>

    <button onclick="createParty()">
      🏠 Create Party
    </button>

    <hr>

    <input
      id="partyCodeInput"
      placeholder="Enter party code"
      maxlength="9"
    >

    <button onclick="joinParty()">
      🔑 Join Party
    </button>

    <p>
      Up to 4 penguins can play together.
    </p>

    <p>
      📶 5-minute reconnect grace period<br>
      💥 1-minute defeat spectator timer<br>
      💬 Party chat
    </p>

    <button onclick="backToMenu()">Back</button>
  `);
}

function generatePartyCode() {

  const number =
    Math.floor(1000 + Math.random() * 9000);

  return "PENG-" + number;
}

function createParty() {

  const partyCode = generatePartyCode();

  localStorage.setItem("partyCode", partyCode);

  showScreen(`
    <h2>🏠 Party Lobby</h2>

    <h3>Party Code</h3>

    <div style="
      font-size:32px;
      font-weight:bold;
      letter-spacing:3px;
    ">
      ${partyCode}
    </div>

    <p>
      Share this code with your friends.
    </p>

    <p id="partyPlayers">
      🐧 Players: 1/${MAX_PARTY_SIZE}
    </p>

    <button onclick="startGame('4-Player Co-op')">
      ▶ Start Co-op
    </button>

    <button onclick="backToMenu()">
      Leave Party
    </button>
  `);
}

function joinParty() {

  const input = $("partyCodeInput");

  if (!input) return;

  const code = input.value.trim().toUpperCase();

  if (!code) {
    toast("Enter a party code.");
    return;
  }

  if (!code.startsWith("PENG-")) {
    toast("Invalid party code.");
    return;
  }

  localStorage.setItem("partyCode", code);

  showScreen(`
    <h2>👥 Party Joined!</h2>

    <h3>${code}</h3>

    <p>
      🟢 Connected to host
    </p>

    <p>
      Waiting for the host to start...
    </p>

    <button onclick="startGame('4-Player Co-op')">
      ▶ Start Co-op
    </button>

    <button onclick="backToMenu()">
      Leave Party
    </button>
  `);
}

// ------------------------------------------------------------
// PVP
// ------------------------------------------------------------

function showPvpMenu() {

  showScreen(`
    <h2>⚔️ PVP</h2>

    <button onclick="startGame('1v1 PVP')">
      1v1
    </button>

    <button onclick="startGame('2v2 PVP')">
      2v2
    </button>

    <button onclick="startGame('4-Penguin Free-for-All')">
      Free-for-All — 4
    </button>

    <button onclick="startGame('MEGA FREE-FOR-ALL — 10')">
      💥 Mega Free-for-All — 10
      <br>
      <small>⚠️ Not recommended</small>
    </button>

    <button onclick="backToMenu()">
      Back
    </button>
  `);
}

// ------------------------------------------------------------
// LEVEL CREATOR
// ------------------------------------------------------------

function showLevelCreator() {

  showScreen(`
    <h2>🛠️ Level Creator</h2>

    <p>
      Build your own Penguin Adventure level.
    </p>

    <div class="creatorGrid">

      <button>🧊 Platform</button>
      <button>🧱 Wall</button>
      <button>🌊 Water</button>
      <button>❄️ Snow</button>

      <button>🪙 Coin</button>
      <button>❤️ Health</button>
      <button>👾 Enemy</button>
      <button>👑 Boss</button>

      <button>🚪 Door</button>
      <button>🏁 Finish</button>
      <button>⬆️ Jump Pad</button>
      <button>⚡ Trap</button>

      <button>💨 Gust Zone</button>
      <button>🐧 Spawn</button>

    </div>

    <br>

    <input
      id="levelName"
      placeholder="Level name"
    >

    <button onclick="saveLevel()">
      💾 Save Level
    </button>

    <button onclick="startGame('Custom Level')">
      ▶ Play Level
    </button>

    <button onclick="backToMenu()">
      Back
    </button>
  `);
}

function saveLevel() {

  const name =
    $("levelName")?.value.trim() || "My Penguin Level";

  localStorage.setItem(
    "customLevelName",
    name
  );

  toast("💾 Level saved!");
}

// ------------------------------------------------------------
// GAME START
// ------------------------------------------------------------

function startGame(gameMode) {

  mode = gameMode;
  running = true;
  frame = 0;

  $("menu")?.classList.add("hidden");
  $("screen")?.classList.add("hidden");
  $("gameWrap")?.classList.remove("hidden");

  if ($("mode")) {
    $("mode").textContent = mode;
  }

  // Player 1
  players = [
    {
      x: 90,
      y: 410,
      vy: 0,
      hp: 5,
      face: 1,
      color: "#222",
      name: "You",
      attack: 0,
      gust: 0,
      defeated: false
    }
  ];

  // Four-player co-op
  if (gameMode.includes("Co-op")) {

    const colors = [
      "#356",
      "#735",
      "#864"
    ];

    for (let i = 1; i < 4; i++) {

      players.push({
        x: 120 + i * 55,
        y: 410,
        vy: 0,
        hp: 5,
        face: 1,
        color: colors[i - 1],
        name: "Player " + (i + 1),
        attack: 0,
        gust: 0,
        defeated: false
      });
    }
  }

  // Mega 10-player PVP
  if (gameMode.includes("10")) {

    const colors = [
      "#356",
      "#735",
      "#864",
      "#587",
      "#a65",
      "#468",
      "#765",
      "#457",
      "#875"
    ];

    for (let i = 1; i < 10; i++) {

      players.push({
        x: 60 + (i % 5) * 180,
        y: 410 - Math.floor(i / 5) * 70,
        vy: 0,
        hp: 5,
        face: 1,
        color: colors[i - 1],
        name: "Player " + (i + 1),
        attack: 0,
        gust: 0,
        defeated: false
      });
    }
  }

  enemies = [
    {
      x: 430,
      y: 420,
      hp: 2,
      name: "SEAL"
    },
    {
      x: 630,
      y: 420,
      hp: 3,
      name: "CRAB"
    },
    {
      x: 770,
      y: 420,
      hp: 4,
      name: "YETI"
    }
  ];

  boss = {
    x: 820,
    y: 340,
    hp: 12,
    max: 12,
    active: false
  };

  requestAnimationFrame(gameLoop);
}

// ------------------------------------------------------------
// PLAYER ACTIONS
// ------------------------------------------------------------

function jump() {

  const p = players[0];

  if (!p) return;

  if (p.y >= 409) {
    p.vy = -12;
  }
}

function punch() {

  const p = players[0];

  if (p) {
    p.attack = 12;
  }
}

function gust() {

  const p = players[0];

  if (p) {
    p.gust = 18;
  }
}

// ------------------------------------------------------------
// DAMAGE
// ------------------------------------------------------------

function hitNearby(range, damage) {

  const p = players[0];

  if (!p) return;

  enemies.forEach(enemy => {

    if (
      enemy.hp > 0 &&
      Math.abs(enemy.x - p.x) < range
    ) {
      enemy.hp -= damage;
    }

  });

  if (
    boss &&
    boss.active &&
    Math.abs(boss.x - p.x) < range
  ) {
    boss.hp -= damage;
  }
}

// ------------------------------------------------------------
// GAME UPDATE
// ------------------------------------------------------------

function updateGame() {

  const p = players[0];

  if (!p) return;

  p.vy += 0.6;

  if (left) {

    p.x -= 4;
    p.face = -1;

  }

  if (right) {

    p.x += 4;
    p.face = 1;

  }

  p.y += p.vy;

  if (p.y > 410) {

    p.y = 410;
    p.vy = 0;

  }

  p.x = Math.max(
    0,
    Math.min(918, p.x)
  );

  // Punch
  if (p.attack) {

    p.attack--;

    if (p.attack === 6) {
      hitNearby(80, 2);
    }
  }

  // Gust
  if (p.gust) {

    p.gust--;

    if (p.gust === 9) {
      hitNearby(150, 1);
    }
  }

  // Visual co-op players
  players.slice(1).forEach((player, index) => {

    player.x +=
      Math.sin(frame / 35 + index) * 0.8;

  });

  // Enemy movement
  enemies.forEach(enemy => {

    if (enemy.hp > 0) {

      enemy.x +=
        Math.sin(frame / 30 + enemy.x) * 0.5;

    }

  });

  // Activate boss after enemies are defeated
  if (
    enemies.length &&
    enemies.every(enemy => enemy.hp <= 0)
  ) {
    boss.active = true;
  }

  // Boss movement
  if (boss.active && boss.hp > 0) {

    boss.x =
      780 + Math.sin(frame / 45) * 60;

  }

  // Boss defeated
  if (boss.hp <= 0) {

    coins += 30;

    localStorage.setItem(
      "coins",
      coins
    );

    toast("🏆 ICE BOSS DEFEATED! +30 COINS!");

    running = false;

    setTimeout(() => {

      $("gameWrap")?.classList.add("hidden");
      $("menu")?.classList.remove("hidden");

    }, 1200);
  }

  if ($("hp")) {
    $("hp").textContent =
      "❤️ " + p.hp;
  }

  if ($("boss")) {

    $("boss").textContent =
      boss.active && boss.hp > 0
        ? "👑 BOSS " +
          boss.hp +
          "/" +
          boss.max
        : "";
  }
}

// ------------------------------------------------------------
// DRAW PENGUIN
// ------------------------------------------------------------

function drawPenguin(player) {

  ctx.fillStyle = player.color;

  ctx.beginPath();

  ctx.ellipse(
    player.x + 20,
    player.y + 28,
    21,
    28,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Belly
  ctx.fillStyle = "#fff";

  ctx.beginPath();

  ctx.ellipse(
    player.x + 20,
    player.y + 31,
    13,
    18,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Feet
  ctx.fillStyle = "#f6a800";

  ctx.fillRect(
    player.x + 4,
    player.y + 51,
    15,
    5
  );

  ctx.fillRect(
    player.x + 27,
    player.y + 51,
    15,
    5
  );

  // Name
  ctx.fillStyle = "#111";
  ctx.font = "13px system-ui";

  ctx.fillText(
    player.name,
    player.x - 3,
    player.y - 7
  );
}

// ------------------------------------------------------------
// DRAW GAME
// ------------------------------------------------------------

function drawGame() {

  if (!ctx) return;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Sky
  ctx.fillStyle = "#dff8ff";

  ctx.fillRect(
    0,
    0,
    960,
    540
  );

  // Ice
  ctx.fillStyle = "#8ed8ef";

  ctx.fillRect(
    0,
    465,
    960,
    75
  );

  // Players
  players.forEach(drawPenguin);

  // Enemies
  enemies.forEach(enemy => {

    if (enemy.hp <= 0) return;

    ctx.fillStyle =
      enemy.name === "YETI"
        ? "#888"
        : "#b66";

    ctx.fillRect(
      enemy.x,
      enemy.y,
      45,
      45
    );

    ctx.fillStyle = "#111";
    ctx.fillText(
      enemy.name,
      enemy.x,
      enemy.y - 7
    );
  });

  // Boss
  if (
    boss &&
    boss.active &&
    boss.hp > 0
  ) {

    ctx.fillStyle = "#555";

    ctx.fillRect(
      boss.x,
      boss.y,
      80,
      100
    );

    // Boss bar
    ctx.fillStyle = "#e33";

    ctx.fillRect(
      boss.x,
      boss.y - 12,
      80 * boss.hp / boss.max,
      8
    );

    ctx.fillStyle = "#111";

    ctx.fillText(
      "ICE BOSS",
      boss.x,
      boss.y - 18
    );
  }

  // Player attacks
  const p = players[0];

  if (p) {

    if (p.attack) {

      ctx.fillStyle = "#f7c948";

      ctx.fillRect(
        p.x +
          (p.face > 0
            ? 40
            : -35),
        p.y + 20,
        35,
        12
      );
    }

    if (p.gust) {

      ctx.strokeStyle = "#3aa";
      ctx.lineWidth = 6;

      ctx.beginPath();

      ctx.arc(
        p.x + p.face * 55,
        p.y + 25,
        30,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }
  }
}

// ------------------------------------------------------------
// GAME LOOP
// ------------------------------------------------------------

function gameLoop() {

  if (!running) return;

  frame++;

  updateGame();
  drawGame();

  requestAnimationFrame(gameLoop);
}

// ------------------------------------------------------------
// MOBILE CONTROLS
// ------------------------------------------------------------

const leftButton =
  document.querySelector(
    '[data-key="left"]'
  );

const rightButton =
  document.querySelector(
    '[data-key="right"]'
  );

if (leftButton) {

  leftButton.addEventListener(
    "pointerdown",
    () => {
      left = true;
      registerActivity();
    }
  );

  leftButton.addEventListener(
    "pointerup",
    () => left = false
  );

  leftButton.addEventListener(
    "pointerleave",
    () => left = false
  );
}

if (rightButton) {

  rightButton.addEventListener(
    "pointerdown",
    () => {
      right = true;
      registerActivity();
    }
  );

  rightButton.addEventListener(
    "pointerup",
    () => right = false
  );

  rightButton.addEventListener(
    "pointerleave",
    () => right = false
  );
}

$("jump")?.addEventListener(
  "click",
  jump
);

$("punch")?.addEventListener(
  "click",
  punch
);

$("gust")?.addEventListener(
  "click",
  gust
);

// ------------------------------------------------------------
// KEYBOARD CONTROLS
// ------------------------------------------------------------

document.addEventListener(
  "keydown",
  event => {

    registerActivity();

    if (event.key === "ArrowLeft") {
      left = true;
    }

    if (event.key === "ArrowRight") {
      right = true;
    }

    if (
      event.key === "ArrowUp" ||
      event.key === " "
    ) {
      jump();
    }

    if (
      event.key.toLowerCase() === "z"
    ) {
      punch();
    }

    if (
      event.key.toLowerCase() === "x"
    ) {
      gust();
    }
  }
);

document.addEventListener(
  "keyup",
  event => {

    if (event.key === "ArrowLeft") {
      left = false;
    }

    if (event.key === "ArrowRight") {
      right = false;
    }
  }
);

// ------------------------------------------------------------
// LEAVE GAME
// ------------------------------------------------------------

if ($("leaveGame")) {

  $("leaveGame").addEventListener(
    "click",
    () => {

      running = false;

      $("gameWrap")?.classList.add("hidden");
      $("menu")?.classList.remove("hidden");

    }
  );
}

// ------------------------------------------------------------
// PARTY CHAT
// ------------------------------------------------------------

function sendPartyChat() {

  const input = $("chatInput");

  if (!input) return;

  const message =
    input.value.trim();

  if (!message) return;

  const messages =
    $("messages");

  if (messages) {

    const line =
      document.createElement("div");

    line.textContent =
      "You: " + message;

    messages.appendChild(line);

    messages.scrollTop =
      messages.scrollHeight;
  }

  input.value = "";

  registerActivity();
}

$("sendChat")?.addEventListener(
  "click",
  sendPartyChat
);

$("chatInput")?.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      sendPartyChat();
    }
  }
);

// ------------------------------------------------------------
// INITIALIZE
// ------------------------------------------------------------

renderFriends();

if ($("coins")) {
  $("coins").textContent =
    "Coins: " + coins;
}

console.log(
  "🐧 Penguin Adventure game.js loaded!"
);
