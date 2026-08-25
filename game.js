/* =========================================================
   🐧 PENGUIN ADVENTURE
   Clean replacement game.js
   ========================================================= */

"use strict";

/* ---------- BASIC ELEMENT HELPERS ---------- */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

const menu = $("#menu");
const gameWrap = $("#gameWrap");
const screen = $("#screen");

const toast = $("#toast");
const hpDisplay = $("#hpDisplay");
const modeDisplay = $("#modeDisplay");
const coinsDisplay = $("#coinsDisplay");

let currentMode = "menu";
let animationId = null;
let lastTime = 0;

/* ---------- PLAYER ---------- */

const player = {
    x: 120,
    y: 300,
    width: 48,
    height: 58,

    vx: 0,
    vy: 0,

    speed: 4.5,
    jump: -12,
    gravity: 0.55,

    hp: 100,
    maxHp: 100,

    coins: Number(localStorage.getItem("penguinCoins") || 0),

    facing: 1,
    attacking: false,
    defeated: false,

    color: "#202b35"
};

/* ---------- GAME ---------- */

const game = {
    running: false,
    level: 1,
    score: 0,

    enemies: [],
    platforms: [],

    keys: {},
    touchLeft: false,
    touchRight: false,

    boss: null,

    paused: false,

    idleSeconds: 0,
    lastActivity: Date.now()
};

/* ---------- CO-OP ---------- */

const party = {
    code: "",
    isHost: false,
    players: [],
    maxPlayers: 4,

    disconnected: {},
    defeated: {},

    gracePeriod: 5 * 60 * 1000,
    spectateTime: 60 * 1000
};

/* ---------- PLAYER NAME / ACCOUNT ---------- */

let playerName =
    localStorage.getItem("penguinPlayerName") ||
    "Penguin";

let playerCode =
    localStorage.getItem("penguinPlayerCode") ||
    createPlayerCode();

localStorage.setItem("penguinPlayerCode", playerCode);

/* ---------- UTILITY ---------- */

function createPlayerCode() {
    return "P" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createPartyCode() {
    return Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
}

function showToast(message) {
    console.log(message);

    if (!toast) return;

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.style.display = "none";
    }, 2200);
}

function saveCoins() {
    localStorage.setItem("penguinCoins", String(player.coins));
}

function updateHUD() {
    if (hpDisplay) {
        hpDisplay.textContent = `❤️ ${Math.max(0, player.hp)}/${player.maxHp}`;
    }

    if (coinsDisplay) {
        coinsDisplay.textContent = `🪙 ${player.coins}`;
    }

    if (modeDisplay) {
        modeDisplay.textContent =
            currentMode === "menu"
                ? "MENU"
                : currentMode.toUpperCase();
    }
}

/* ---------- CANVAS ---------- */

function resizeCanvas() {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.max(320, rect.width * ratio);
    canvas.height = Math.max(240, rect.height * ratio);

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

/* ---------- SCREEN / MENU ---------- */

function showMenu() {
    currentMode = "menu";
    game.running = false;

    if (menu) menu.style.display = "";
    if (gameWrap) gameWrap.style.display = "none";

    updateHUD();
}

function showGame() {
    if (menu) menu.style.display = "none";
    if (gameWrap) gameWrap.style.display = "";

    if (screen) screen.style.display = "";

    resizeCanvas();

    game.running = true;
    lastTime = performance.now();

    if (!animationId) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

/* ---------- START ADVENTURE ---------- */

function startAdventure() {
    currentMode = "adventure";

    player.x = 100;
    player.y = 200;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.defeated = false;

    createLevel(1);

    showGame();

    showToast("🐧 Adventure started!");
    updateHUD();
}

/* ---------- LEVEL CREATOR ---------- */

function openLevelCreator() {
    currentMode = "level creator";

    showGame();

    game.platforms = [
        { x: 0, y: 430, w: 1000, h: 40 },
        { x: 250, y: 340, w: 180, h: 20 },
        { x: 550, y: 270, w: 180, h: 20 }
    ];

    game.enemies = [];

    showToast("🛠️ Level Creator");
}

function createLevel(level) {
    game.level = level;

    game.platforms = [
        { x: 0, y: 430, w: 1200, h: 50 },
        { x: 220, y: 350, w: 180, h: 20 },
        { x: 520, y: 300, w: 180, h: 20 },
        { x: 800, y: 240, w: 180, h: 20 }
    ];

    game.enemies = [];

    const enemyCount = Math.min(2 + level, 7);

    for (let i = 0; i < enemyCount; i++) {
        game.enemies.push({
            x: 300 + i * 120,
            y: 390,
            w: 42,
            h: 42,
            hp: 30,
            maxHp: 30,
            vx: i % 2 ? -1 : 1,
            alive: true
        });
    }

    if (level % 3 === 0) {
        game.boss = {
            x: 850,
            y: 160,
            w: 100,
            h: 100,
            hp: 300,
            maxHp: 300,
            vx: 1,
            alive: true
        };
    } else {
        game.boss = null;
    }
}

/* ---------- MOVEMENT ---------- */

function movePlayer() {
    const left =
        game.keys.ArrowLeft ||
        game.keys.a ||
        game.touchLeft;

    const right =
        game.keys.ArrowRight ||
        game.keys.d ||
        game.touchRight;

    if (left) {
        player.vx = -player.speed;
        player.facing = -1;
    } else if (right) {
        player.vx = player.speed;
        player.facing = 1;
    } else {
        player.vx *= 0.78;
    }

    player.vy += player.gravity;

    player.x += player.vx;
    player.y += player.vy;

    if (player.x < 0) player.x = 0;

    if (canvas) {
        const width = canvas.clientWidth || 1000;

        if (player.x + player.width > width) {
            player.x = width - player.width;
        }
    }

    /* Ground */

    const groundY = 430;

    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height;
        player.vy = 0;
    }

    /* Platforms */

    for (const p of game.platforms) {
        const falling =
            player.vy >= 0 &&
            player.y + player.height <= p.y + 20 &&
            player.y + player.height + player.vy >= p.y;

        const horizontal =
            player.x + player.width > p.x &&
            player.x < p.x + p.w;

        if (falling && horizontal) {
            player.y = p.y - player.height;
            player.vy = 0;
        }
    }

    if (player.y > 700) {
        damagePlayer(999);
    }
}

function jump() {
    if (player.defeated) return;

    const groundY = 430;

    if (player.y + player.height >= groundY - 5) {
        player.vy = player.jump;
        registerActivity();
    }
}

/* ---------- ATTACK ---------- */

function attack() {
    if (!game.running || player.defeated) return;
    if (player.attacking) return;

    player.attacking = true;
    registerActivity();

    setTimeout(() => {
        player.attacking = false;
    }, 220);

    const attackRange = 75;

    for (const enemy of game.enemies) {
        if (!enemy.alive) continue;

        const distance = Math.abs(
            enemy.x - player.x
        );

        if (distance <= attackRange) {
            enemy.hp -= 20;

            if (enemy.hp <= 0) {
                enemy.alive = false;
                player.coins += 10;
                game.score += 100;
                saveCoins();

                showToast("⭐ Enemy defeated!");
            }
        }
    }

    if (game.boss && game.boss.alive) {
        const distance = Math.abs(
            game.boss.x - player.x
        );

        if (distance <= attackRange + 30) {
            game.boss.hp -= 15;

            if (game.boss.hp <= 0) {
                game.boss.alive = false;
                player.coins += 100;
                saveCoins();

                showToast("👑 BOSS DEFEATED!");
            }
        }
    }

    updateHUD();
}

/* ---------- ENEMIES ---------- */

function updateEnemies() {
    for (const enemy of game.enemies) {
        if (!enemy.alive) continue;

        enemy.x += enemy.vx;

        if (enemy.x < 150 || enemy.x > 1000) {
            enemy.vx *= -1;
        }

        const close =
            Math.abs(enemy.x - player.x) < 50 &&
            Math.abs(enemy.y - player.y) < 60;

        if (close && Math.random() < 0.015) {
            damagePlayer(8);
        }
    }

    if (game.boss && game.boss.alive) {
        game.boss.x += game.boss.vx;

        if (game.boss.x < 700 || game.boss.x > 1050) {
            game.boss.vx *= -1;
        }

        if (
            Math.abs(game.boss.x - player.x) < 90 &&
            Math.random() < 0.02
        ) {
            damagePlayer(15);
        }
    }
}

/* ---------- HEALTH / DEFEAT ---------- */

function damagePlayer(amount) {
    if (player.defeated) return;

    player.hp -= amount;

    if (player.hp <= 0) {
        player.hp = 0;
        defeatPlayer();
    }

    updateHUD();
}

function defeatPlayer() {
    player.defeated = true;
    player.vx = 0;
    player.vy = 0;

    showToast("💥 You were defeated! Spectating for 1 minute.");

    party.defeated[playerCode] = {
        time: Date.now()
    };

    /* One-minute spectating period */

    setTimeout(() => {
        if (!player.defeated) return;

        player.hp = player.maxHp;
        player.defeated = false;

        showToast("🐧 You revived!");
        updateHUD();
    }, party.spectateTime);
}

/* ---------- DRAWING ---------- */

function clearCanvas() {
    if (!canvas || !ctx) return;

    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;

    ctx.clearRect(0, 0, w, h);

    /* Sky */

    ctx.fillStyle = "#dff8ff";
    ctx.fillRect(0, 0, w, h);

    /* Snow */

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 430, w, h - 430);
}

function drawPenguin(x, y, color = "#202b35", scale = 1) {
    ctx.save();

    ctx.translate(x, y);
    ctx.scale(scale, scale);

    /* body */

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.ellipse(24, 30, 22, 29, 0, 0, Math.PI * 2);
    ctx.fill();

    /* belly */

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.ellipse(24, 35, 14, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    /* eyes */

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(16, 17, 6, 0, Math.PI * 2);
    ctx.arc(32, 17, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111111";

    ctx.beginPath();
    ctx.arc(16, 17, 2.5, 0, Math.PI * 2);
    ctx.arc(32, 17, 2.5, 0, Math.PI * 2);
    ctx.fill();

    /* beak */

    ctx.fillStyle = "#ff9f1c";

    ctx.beginPath();
    ctx.moveTo(19, 24);
    ctx.lineTo(29, 24);
    ctx.lineTo(24, 31);
    ctx.closePath();
    ctx.fill();

    /* feet */

    ctx.fillStyle = "#ff9f1c";

    ctx.beginPath();
    ctx.ellipse(13, 58, 9, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(35, 58, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawEnemy(enemy) {
    if (!enemy.alive) return;

    ctx.fillStyle = "#d94a4a";

    ctx.fillRect(
        enemy.x,
        enemy.y,
        enemy.w,
        enemy.h
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
        enemy.x + 8,
        enemy.y + 9,
        8,
        8
    );

    ctx.fillRect(
        enemy.x + 26,
        enemy.y + 9,
        8,
        8
    );

    ctx.fillStyle = "#111111";

    ctx.fillRect(
        enemy.x + 10,
        enemy.y + 11,
        4,
        4
    );

    ctx.fillRect(
        enemy.x + 28,
        enemy.y + 11,
        4,
        4
    );

    /* health */

    ctx.fillStyle = "#333";
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.w, 5);

    ctx.fillStyle = "#39b54a";
    ctx.fillRect(
        enemy.x,
        enemy.y - 8,
        enemy.w * (enemy.hp / enemy.maxHp),
        5
    );
}

function drawBoss() {
    const boss = game.boss;

    if (!boss || !boss.alive) return;

    ctx.fillStyle = "#7136a8";

    ctx.fillRect(
        boss.x,
        boss.y,
        boss.w,
        boss.h
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
        "BOSS",
        boss.x + boss.w / 2,
        boss.y - 12
    );

    /* Boss bar */

    ctx.fillStyle = "#222";
    ctx.fillRect(
        boss.x - 20,
        boss.y - 30,
        boss.w + 40,
        10
    );

    ctx.fillStyle = "#e33";
    ctx.fillRect(
        boss.x - 20,
        boss.y - 30,
        (boss.w + 40) *
            (boss.hp / boss.maxHp),
        10
    );
}

function drawPlatforms() {
    ctx.fillStyle = "#9bd18b";

    for (const p of game.platforms) {
        ctx.fillRect(
            p.x,
            p.y,
            p.w,
            p.h
        );
    }
}

function drawGame() {
    if (!canvas || !ctx) return;

    clearCanvas();

    drawPlatforms();

    for (const enemy of game.enemies) {
        drawEnemy(enemy);
    }

    drawBoss();

    if (!player.defeated) {
        drawPenguin(
            player.x,
            player.y,
            player.color,
            1
        );

        if (player.attacking) {
            ctx.fillStyle = "#ffffff";

            ctx.beginPath();

            ctx.arc(
                player.x +
                    (player.facing === 1 ? 62 : -14),
                player.y + 30,
                15,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    } else {
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = "#222";
        ctx.textAlign = "center";

        ctx.fillText(
            "SPECTATING",
            player.x + 24,
            player.y - 20
        );
    }
}

/* ---------- GAME LOOP ---------- */

function gameLoop(time) {
    animationId = requestAnimationFrame(gameLoop);

    const delta = Math.min(
        50,
        time - lastTime
    );

    lastTime = time;

    if (!game.running) return;

    if (!game.paused) {
        movePlayer();
        updateEnemies();
        drawGame();
        updateIdle();
    }
}

/* ---------- KEYBOARD ---------- */

window.addEventListener("keydown", (event) => {
    game.keys[event.key] = true;

    registerActivity();

    if (
        event.key === " " ||
        event.key === "ArrowUp" ||
        event.key === "w"
    ) {
        event.preventDefault();
        jump();
    }

    if (
        event.key === "x" ||
        event.key === "j"
    ) {
        attack();
    }

    if (event.key === "Escape") {
        showMenu();
    }
});

window.addEventListener("keyup", (event) => {
    game.keys[event.key] = false;
});

/* ---------- TOUCH CONTROLS ---------- */

function bindTouchButton(selectors, action) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);

        if (!element) continue;

        element.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            action(true);
            registerActivity();
        });

        element.addEventListener("pointerup", (event) => {
            event.preventDefault();
            action(false);
        });

        element.addEventListener("pointercancel", () => {
            action(false);
        });
    }
}

bindTouchButton(
    ["#leftBtn", "#left", "[data-action='left']"],
    (pressed) => {
        game.touchLeft = pressed;
    }
);

bindTouchButton(
    ["#rightBtn", "#right", "[data-action='right']"],
    (pressed) => {
        game.touchRight = pressed;
    }
);

bindTouchButton(
    ["#jumpBtn", "#jump", "[data-action='jump']"],
    (pressed) => {
        if (pressed) jump();
    }
);

bindTouchButton(
    ["#attackBtn", "#attack", "#punchBtn", "[data-action='attack']"],
    (pressed) => {
        if (pressed) attack();
    }
);

/* ---------- UNIVERSAL BUTTON SYSTEM ---------- */

/*
   This system looks at button IDs AND button text.

   That means your existing buttons can work even if
   their exact IDs are different.
*/

function buttonAction(button) {
    const id = (
        button.id || ""
    ).toLowerCase();

    const text = (
        button.textContent || ""
    ).trim().toLowerCase();

    const combined = id + " " + text;

    /* Start Adventure */

    if (
        combined.includes("start") &&
        combined.includes("adventure")
    ) {
        startAdventure();
        return;
    }

    /* Level Creator */

    if (
        combined.includes("level") &&
        (
            combined.includes("creator") ||
            combined.includes("create")
        )
    ) {
        openLevelCreator();
        return;
    }

    /* Co-op */

    if (
        combined.includes("co-op") ||
        combined.includes("coop")
    ) {
        openCoopMenu();
        return;
    }

    /* PvP */

    if (
        combined.includes("pvp") ||
        combined.includes("p v p")
    ) {
        openPvPMenu();
        return;
    }

    /* Shop */

    if (combined.includes("shop")) {
        openShop();
        return;
    }

    /* Friends */

    if (
        combined.includes("friend") ||
        id === "friendsbtn"
    ) {
        openFriends();
        return;
    }

    /* Back */

    if (
        combined === "back" ||
        id === "backbtn" ||
        id === "closefriends"
    ) {
        showMenu();
        return;
    }

    /* Jump */

    if (
        combined.includes("jump")
    ) {
        jump();
        return;
    }

    /* Punch / attack */

    if (
        combined.includes("punch") ||
        combined.includes("attack")
    ) {
        attack();
        return;
    }

    /* Send chat */

    if (
        combined.includes("send") &&
        combined.includes("chat")
    ) {
        sendChat();
        return;
    }

    /* Host */

    if (
        combined.includes("host") &&
        (
            combined.includes("party") ||
            combined.includes("coop") ||
            combined.includes("co-op")
        )
    ) {
        hostParty();
        return;
    }

    /* Join */

    if (
        combined.includes("join") &&
        (
            combined.includes("party") ||
            combined.includes("coop") ||
            combined.includes("co-op")
        )
    ) {
        joinParty();
        return;
    }
}

document.addEventListener("click", (event) => {
    const button = event.target.closest(
        "button, [role='button']"
    );

    if (!button) return;

    registerActivity();

    buttonAction(button);
});

/* ---------- FRIENDS ---------- */

function openFriends() {
    currentMode = "friends";

    const panel =
        $("#friendsPanel") ||
        document.querySelector(".friends-panel");

    if (panel) {
        panel.style.display = "block";
    }

    showToast("👥 Friends");
}

function addFriend() {
    const code = prompt(
        "Enter your friend's player code:"
    );

    if (!code) return;

    const friends =
        JSON.parse(
            localStorage.getItem("penguinFriends") ||
            "[]"
        );

    if (!friends.includes(code.toUpperCase())) {
        friends.push(code.toUpperCase());

        localStorage.setItem(
            "penguinFriends",
            JSON.stringify(friends)
        );
    }

    showToast("✅ Friend added!");
}

/* ---------- SHOP ---------- */

function openShop() {
    currentMode = "shop";

    showToast(
        `🏪 Penguin Shop — You have ${player.coins} coins`
    );

    /*
       Example shop purchases.
    */

    const choice = prompt(
        "Penguin Shop\n\n" +
        "1 = Speed upgrade (50 coins)\n" +
        "2 = Health upgrade (75 coins)\n" +
        "Cancel = leave shop"
    );

    if (choice === "1") {
        if (player.coins >= 50) {
            player.coins -= 50;
            player.speed += 0.5;
            saveCoins();
            showToast("⚡ Speed upgraded!");
        } else {
            showToast("❌ Not enough coins.");
        }
    }

    if (choice === "2") {
        if (player.coins >= 75) {
            player.coins -= 75;
            player.maxHp += 20;
            player.hp = player.maxHp;
            saveCoins();
            showToast("❤️ Health upgraded!");
        } else {
            showToast("❌ Not enough coins.");
        }
    }

    updateHUD();
}

/* ---------- CO-OP ---------- */

function openCoopMenu() {
    currentMode = "coop";

    const choice = prompt(
        "🐧 CO-OP\n\n" +
        "1 = Host a party\n" +
        "2 = Join with a code"
    );

    if (choice === "1") {
        hostParty();
    }

    if (choice === "2") {
        joinParty();
    }
}

function hostParty() {
    party.code = createPartyCode();
    party.isHost = true;

    party.players = [
        {
            code: playerCode,
            name: playerName,
            host: true,
            connected: true,
            hp: player.hp
        }
    ];

    showToast(
        `🎮 Party created! Code: ${party.code}`
    );

    alert(
        "🐧 Your co-op party code is:\n\n" +
        party.code +
        "\n\nGive this code to your friends."
    );
}

function joinParty() {
    const code = prompt(
        "Enter the 6-character party code:"
    );

    if (!code) return;

    party.code = code
        .trim()
        .toUpperCase();

    party.isHost = false;

    party.players.push({
        code: playerCode,
        name: playerName,
        host: false,
        connected: true,
        hp: player.hp
    });

    showToast(
        `🐧 Joined party ${party.code}`
    );

    /*
       IMPORTANT:
       This creates the party interface and code system.

       Real players on different devices require a
       multiplayer server/WebSocket/WebRTC connection.
       This file does not pretend localStorage can
       magically connect two devices.
    */
}

/* ---------- PARTY DISCONNECT ---------- */

function playerDisconnected(code, name = "Player") {
    party.disconnected[code] = Date.now();

    showToast(
        `⚠️ ${name} disconnected. They have 5 minutes to rejoin.`
    );

    setTimeout(() => {
        const disconnectedAt =
            party.disconnected[code];

        if (
            disconnectedAt &&
            Date.now() - disconnectedAt >=
                party.gracePeriod
        ) {
            delete party.disconnected[code];

            showToast(
                `❌ ${name} left the party.`
            );
        }
    }, party.gracePeriod);
}

function playerReconnected(code, name = "Player") {
    delete party.disconnected[code];

    showToast(
        `🟢 ${name} reconnected!`
    );
}

/* ---------- PARTY DEFEAT ---------- */

function partyPlayerDefeated(
    code,
    name = "Player"
) {
    party.defeated[code] = Date.now();

    showToast(
        `💥 ${name} was defeated and is spectating for 1 minute.`
    );
}

/* ---------- PARTY CHAT ---------- */

function sendChat() {
    const input = $("#chatInput");

    if (!input) {
        showToast("Chat input not found.");
        return;
    }

    const message = input.value.trim();

    if (!message) return;

    const chat =
        $("#chatMessages") ||
        $("#partyChat") ||
        document.querySelector(".chat-messages");

    if (chat) {
        const line =
            document.createElement("div");

        line.textContent =
            `${playerName}: ${message}`;

        chat.appendChild(line);

        chat.scrollTop = chat.scrollHeight;
    }

    input.value = "";

    /*
       The message is displayed locally.
       A real cross-device party chat requires the
       multiplayer connection described above.
    */
}

/* Enter key sends party chat */

document.addEventListener("keydown", (event) => {
    if (
        event.key === "Enter" &&
        document.activeElement === $("#chatInput")
    ) {
        sendChat();
    }
});

/* ---------- PVP ---------- */

function openPvPMenu() {
    currentMode = "pvp";

    const choice = prompt(
        "⚔️ PVP\n\n" +
        "1 = 1v1\n" +
        "2 = Team Battle\n" +
        "3 = Mega Free For All — up to 10 penguins"
    );

    if (choice === "1") {
        startPvP("1v1");
    }

    if (choice === "2") {
        startPvP("team");
    }

    if (choice === "3") {
        startPvP("mega");
    }
}

function startPvP(type) {
    currentMode = "pvp";

    showGame();

    if (type === "mega") {
        showToast(
            "⚠️ Mega Free For All — up to 10 penguins!"
        );
    } else {
        showToast(
            `⚔️ ${type.toUpperCase()} started!`
        );
    }

    createLevel(1);
}

/* ---------- IDLE / AWAY ---------- */

function registerActivity() {
    game.lastActivity = Date.now();

    if (game.idleSeconds >= 60) {
        showToast("🐧 Welcome back!");
    }

    game.idleSeconds = 0;
}

function updateIdle() {
    game.idleSeconds =
        (Date.now() - game.lastActivity) / 1000;

    if (
        game.idleSeconds >= 60 &&
        game.idleSeconds < 61
    ) {
        showToast(
            "💤 You are now marked as away."
        );
    }
}

/* ---------- PLAYER ACCOUNT ---------- */

function openAccount() {
    const newName = prompt(
        "Enter your penguin name:",
        playerName
    );

    if (!newName) return;

    playerName = newName.trim();

    localStorage.setItem(
        "penguinPlayerName",
        playerName
    );

    showToast(
        `🐧 Welcome, ${playerName}!`
    );
}

/* ---------- FRIEND BUTTON ---------- */

if (document.querySelector("#friendsBtn")) {
    document
        .querySelector("#friendsBtn")
        .addEventListener("click", openFriends);
}

if (document.querySelector("#closeFriends")) {
    document
        .querySelector("#closeFriends")
        .addEventListener("click", showMenu);
}

/* ---------- CHAT BUTTON ---------- */

if (document.querySelector("#sendChat")) {
    document
        .querySelector("#sendChat")
        .addEventListener("click", sendChat);
}

/* ---------- SAFETY AGAINST MISSING ELEMENTS ---------- */

/*
   These listeners intentionally check whether an element
   exists before using it. This prevents one missing button
   from crashing the entire game.js file.
*/

function safeListener(selector, event, callback) {
    const element = $(selector);

    if (!element) return;

    element.addEventListener(event, callback);
}

safeListener(
    "#startAdventure",
    "click",
    startAdventure
);

safeListener(
    "#levelCreator",
    "click",
    openLevelCreator
);

safeListener(
    "#pvpBtn",
    "click",
    openPvPMenu
);

safeListener(
    "#coopBtn",
    "click",
    openCoopMenu
);

safeListener(
    "#shopBtn",
    "click",
    openShop
);

safeListener(
    "#accountBtn",
    "click",
    openAccount
);

/* ---------- INITIALIZE ---------- */

resizeCanvas();
updateHUD();

console.log(
    "🐧 Penguin Adventure loaded successfully!"
);

console.log(
    "Player code:",
    playerCode
);

console.log(
    "Player name:",
    playerName
);