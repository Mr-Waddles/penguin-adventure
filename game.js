"use strict";

/* =========================================================
   🐧 PENGUIN ADVENTURE
   Simple, reliable game.js
   Works with <canvas id="game">
   ========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

/* ---------- GAME STATE ---------- */

let playing = false;
let mode = "adventure";
let level = 1;
let coins = Number(localStorage.getItem("penguinCoins") || 0);

const keys = {};

const player = {
    x: 100,
    y: 300,
    w: 42,
    h: 55,
    vx: 0,
    vy: 0,
    speed: 4,
    jump: -11,
    hp: 100,
    maxHp: 100,
    facing: 1,
    attacking: false,
    defeated: false
};

let enemies = [];
let boss = null;

/* ---------- CANVAS ---------- */

function resizeCanvas() {
    if (!canvas) return;

    const width =
        canvas.parentElement?.clientWidth || 960;

    canvas.width = Math.min(width, 960);
    canvas.height = 540;

    canvas.style.maxWidth = "100%";
    canvas.style.height = "auto";
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ---------- MENU ---------- */

function startAdventure() {
    mode = "adventure";
    level = 1;

    player.x = 100;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    player.hp = 100;
    player.defeated = false;

    createLevel();

    playing = true;

    hideMenu();

    message("🐧 Adventure starting!");
}

function hideMenu() {
    const menu =
        document.getElementById("menu");

    if (menu) {
        menu.style.display = "none";
    }
}

function showMenu() {
    playing = false;

    const menu =
        document.getElementById("menu");

    if (menu) {
        menu.style.display = "";
    }
}

/* ---------- LEVEL ---------- */

function createLevel() {
    enemies = [];

    const number =
        mode === "mega" ? 9 : 3 + level;

    for (let i = 0; i < number; i++) {
        enemies.push({
            x: 350 + i * 80,
            y: 390,
            w: 40,
            h: 40,
            hp: 30,
            maxHp: 30,
            direction: i % 2 ? 1 : -1,
            alive: true
        });
    }

    boss =
        level % 3 === 0
            ? {
                x: 750,
                y: 300,
                w: 90,
                h: 90,
                hp: 250,
                maxHp: 250,
                direction: 1,
                alive: true
            }
            : null;
}

/* ---------- PLAYER ---------- */

function updatePlayer() {
    if (player.defeated) return;

    if (
        keys.ArrowLeft ||
        keys.a
    ) {
        player.vx = -player.speed;
        player.facing = -1;
    }
    else if (
        keys.ArrowRight ||
        keys.d
    ) {
        player.vx = player.speed;
        player.facing = 1;
    }
    else {
        player.vx *= 0.75;
    }

    player.vy += 0.55;

    player.x += player.vx;
    player.y += player.vy;

    const ground = 440;

    if (
        player.y + player.h >= ground
    ) {
        player.y = ground - player.h;
        player.vy = 0;
    }

    if (player.x < 0) {
        player.x = 0;
    }

    if (
        canvas &&
        player.x + player.w > canvas.width
    ) {
        player.x =
            canvas.width - player.w;
    }
}

function jump() {
    if (player.defeated) return;

    const ground = 440;

    if (
        player.y + player.h >=
        ground - 3
    ) {
        player.vy = player.jump;
    }
}

/* ---------- ATTACK ---------- */

function attack() {
    if (!playing) return;
    if (player.defeated) return;
    if (player.attacking) return;

    player.attacking = true;

    setTimeout(() => {
        player.attacking = false;
    }, 180);

    for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const distance =
            Math.abs(enemy.x - player.x);

        if (distance < 75) {
            enemy.hp -= 20;

            if (enemy.hp <= 0) {
                enemy.alive = false;
                coins += 10;

                localStorage.setItem(
                    "penguinCoins",
                    coins
                );

                message(
                    "⭐ Enemy defeated!"
                );
            }
        }
    }

    if (boss && boss.alive) {
        const distance =
            Math.abs(boss.x - player.x);

        if (distance < 100) {
            boss.hp -= 15;

            if (boss.hp <= 0) {
                boss.alive = false;
                coins += 100;

                localStorage.setItem(
                    "penguinCoins",
                    coins
                );

                message(
                    "👑 BOSS DEFEATED!"
                );
            }
        }
    }
}

/* ---------- ENEMIES ---------- */

function updateEnemies() {
    for (const enemy of enemies) {
        if (!enemy.alive) continue;

        enemy.x += enemy.direction * 1.2;

        if (
            enemy.x < 200 ||
            enemy.x > 900
        ) {
            enemy.direction *= -1;
        }

        const close =
            Math.abs(
                enemy.x - player.x
            ) < 42 &&
            Math.abs(
                enemy.y - player.y
            ) < 50;

        if (
            close &&
            Math.random() < 0.025
        ) {
            hurt(5);
        }
    }

    if (boss && boss.alive) {
        boss.x +=
            boss.direction * 1.5;

        if (
            boss.x < 650 ||
            boss.x > 900
        ) {
            boss.direction *= -1;
        }

        if (
            Math.abs(
                boss.x - player.x
            ) < 85 &&
            Math.random() < 0.03
        ) {
            hurt(10);
        }
    }

    /* Level complete */

    const remaining =
        enemies.some(e => e.alive);

    if (
        !remaining &&
        (!boss || !boss.alive)
    ) {
        level++;

        createLevel();

        message(
            `🎉 Level ${level}!`
        );
    }
}

/* ---------- HEALTH ---------- */

function hurt(amount) {
    if (player.defeated) return;

    player.hp -= amount;

    if (player.hp <= 0) {
        player.hp = 0;
        defeat();
    }
}

function defeat() {
    if (player.defeated) return;

    player.defeated = true;

    message(
        "💥 Penguin defeated! Spectating for 1 minute."
    );

    /* One-minute revive timer */

    setTimeout(() => {
        if (!playing) return;

        player.hp = player.maxHp;
        player.defeated = false;

        message(
            "🐧 Penguin revived!"
        );
    }, 60000);
}

/* ---------- DRAWING ---------- */

function drawBackground() {
    ctx.fillStyle = "#8edcf5";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    /* Snow */

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        440,
        canvas.width,
        100
    );

    /* Mountains */

    ctx.fillStyle = "#d8f5ff";

    ctx.beginPath();
    ctx.moveTo(0, 440);
    ctx.lineTo(180, 210);
    ctx.lineTo(350, 440);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(250, 440);
    ctx.lineTo(500, 170);
    ctx.lineTo(750, 440);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(650, 440);
    ctx.lineTo(850, 220);
    ctx.lineTo(1100, 440);
    ctx.fill();
}

function drawPenguin() {
    const x = player.x;
    const y = player.y;

    /* Body */

    ctx.fillStyle = "#202833";

    ctx.beginPath();

    ctx.ellipse(
        x + 21,
        y + 29,
        21,
        28,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* Belly */

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.ellipse(
        x + 21,
        y + 35,
        13,
        19,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* Eyes */

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.arc(
        x + 14,
        y + 17,
        6,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 28,
        y + 17,
        6,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#111111";

    ctx.beginPath();

    ctx.arc(
        x + 14,
        y + 17,
        2,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 28,
        y + 17,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* Beak */

    ctx.fillStyle = "#ffad1f";

    ctx.beginPath();

    ctx.moveTo(
        x + 15,
        y + 25
    );

    ctx.lineTo(
        x + 27,
        y + 25
    );

    ctx.lineTo(
        x + 21,
        y + 32
    );

    ctx.closePath();

    ctx.fill();

    /* Feet */

    ctx.fillStyle = "#ffad1f";

    ctx.fillRect(
        x + 5,
        y + 53,
        14,
        5
    );

    ctx.fillRect(
        x + 24,
        y + 53,
        14,
        5
    );

    /* Attack */

    if (player.attacking) {
        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(
            x +
                (player.facing === 1
                    ? 68
                    : -5),
            y + 28,
            16,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

function drawEnemy(enemy) {
    if (!enemy.alive) return;

    /* Enemy body */

    ctx.fillStyle = "#d94b4b";

    ctx.beginPath();

    ctx.roundRect(
        enemy.x,
        enemy.y,
        enemy.w,
        enemy.h,
        8
    );

    ctx.fill();

    /* Eyes */

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        enemy.x + 7,
        enemy.y + 8,
        8,
        8
    );

    ctx.fillRect(
        enemy.x + 25,
        enemy.y + 8,
        8,
        8
    );

    /* Health bar */

    ctx.fillStyle = "#333333";

    ctx.fillRect(
        enemy.x,
        enemy.y - 8,
        enemy.w,
        5
    );

    ctx.fillStyle = "#35b85a";

    ctx.fillRect(
        enemy.x,
        enemy.y - 8,
        enemy.w *
            (enemy.hp /
                enemy.maxHp),
        5
    );
}

function drawBoss() {
    if (!boss || !boss.alive) return;

    /* Boss */

    ctx.fillStyle = "#7038a5";

    ctx.beginPath();

    ctx.roundRect(
        boss.x,
        boss.y,
        boss.w,
        boss.h,
        15
    );

    ctx.fill();

    /* Boss eyes */

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        boss.x + 18,
        boss.y + 25,
        15,
        15
    );

    ctx.fillRect(
        boss.x + 57,
        boss.y + 25,
        15,
        15
    );

    /* Boss bar */

    ctx.fillStyle = "#222222";

    ctx.fillRect(
        boss.x - 20,
        boss.y - 25,
        boss.w + 40,
        10
    );

    ctx.fillStyle = "#e33";

    ctx.fillRect(
        boss.x - 20,
        boss.y - 25,
        (boss.w + 40) *
            (boss.hp /
                boss.maxHp),
        10
    );

    ctx.fillStyle = "#222";

    ctx.font =
        "bold 16px sans-serif";

    ctx.textAlign = "center";

    ctx.fillText(
        "BOSS",
        boss.x + boss.w / 2,
        boss.y - 32
    );
}

/* ---------- HUD ---------- */

function drawHUD() {
    ctx.fillStyle =
        "rgba(0,0,0,.55)";

    ctx.fillRect(
        10,
        10,
        230,
        70
    );

    ctx.fillStyle = "#ffffff";

    ctx.font =
        "bold 16px sans-serif";

    ctx.textAlign = "left";

    ctx.fillText(
        `❤️ ${player.hp}/${player.maxHp}`,
        20,
        35
    );

    ctx.fillText(
        `🪙 ${coins}`,
        20,
        60
    );

    ctx.fillText(
        `Level ${level}`,
        130,
        35
    );
}

/* ---------- DEFEATED SCREEN ---------- */

function drawDefeated() {
    if (!player.defeated) return;

    ctx.fillStyle =
        "rgba(0,0,0,.55)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#ffffff";

    ctx.textAlign = "center";

    ctx.font =
        "bold 32px sans-serif";

    ctx.fillText(
        "🐧 DEFEATED",
        canvas.width / 2,
        230
    );

    ctx.font =
        "18px sans-serif";

    ctx.fillText(
        "Spectating...",
        canvas.width / 2,
        270
    );

    ctx.fillText(
        "Reviving in 1 minute",
        canvas.width / 2,
        300
    );
}

/* ---------- MAIN DRAW ---------- */

function draw() {
    if (!canvas || !ctx) return;

    drawBackground();

    if (playing) {
        for (const enemy of enemies) {
            drawEnemy(enemy);
        }

        drawBoss();
        drawPenguin();
        drawHUD();
        drawDefeated();
    }
}

/* ---------- GAME LOOP ---------- */

function loop() {
    if (playing) {
        updatePlayer();
        updateEnemies();
    }

    draw();

    requestAnimationFrame(loop);
}

loop();

/* ---------- KEYBOARD ---------- */

document.addEventListener(
    "keydown",
    event => {
        keys[event.key] = true;

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
    }
);

document.addEventListener(
    "keyup",
    event => {
        keys[event.key] = false;
    }
);

/* ---------- TOUCH CONTROLS ---------- */

function touchAction(action) {
    return event => {
        event.preventDefault();

        if (action === "left") {
            keys.ArrowLeft =
                event.type !== "pointerup";
        }

        if (action === "right") {
            keys.ArrowRight =
                event.type !== "pointerup";
        }

        if (
            action === "jump" &&
            event.type === "pointerdown"
        ) {
            jump();
        }

        if (
            action === "attack" &&
            event.type === "pointerdown"
        ) {
            attack();
        }
    };
}

function bindControl(
    selectors,
    action
) {
    for (const selector of selectors) {
        const element =
            document.querySelector(selector);

        if (!element) continue;

        element.addEventListener(
            "pointerdown",
            touchAction(action)
        );

        element.addEventListener(
            "pointerup",
            touchAction(action)
        );

        element.addEventListener(
            "pointercancel",
            touchAction(action)
        );
    }
}

bindControl(
    [
        "#left",
        "#leftBtn",
        "[data-action='left']"
    ],
    "left"
);

bindControl(
    [
        "#right",
        "#rightBtn",
        "[data-action='right']"
    ],
    "right"
);

bindControl(
    [
        "#jump",
        "#jumpBtn",
        "[data-action='jump']"
    ],
    "jump"
);

bindControl(
    [
        "#attack",
        "#attackBtn",
        "#punchBtn",
        "[data-action='attack']"
    ],
    "attack"
);

/* ---------- MENU BUTTONS ---------- */

/*
   We use event delegation so the game doesn't crash
   if a button ID is slightly different.
*/

document.addEventListener(
    "click",
    event => {
        const button =
            event.target.closest(
                "button, [role='button']"
            );

        if (!button) return;

        const id =
            (button.id || "")
            .toLowerCase();

        const text =
            (button.textContent || "")
            .toLowerCase()
            .trim();

        const value =
            id + " " + text;

        /* Start Adventure */

        if (
            value.includes("start") ||
            value.includes("adventure")
        ) {
            startAdventure();
            return;
        }

        /* Co-op */

        if (
            value.includes("co-op") ||
            value.includes("coop")
        ) {
            openCoop();
            return;
        }

        /* PvP */

        if (
            value.includes("pvp") ||
            value.includes("p v p")
        ) {
            openPvP();
            return;
        }

        /* Level Creator */

        if (
            value.includes("level") &&
            (
                value.includes("creator") ||
                value.includes("create")
            )
        ) {
            openCreator();
            return;
        }

        /* Shop */

        if (
            value.includes("shop")
        ) {
            openShop();
            return;
        }

        /* Friends */

        if (
            value.includes("friend")
        ) {
            openFriends();
            return;
        }

        /* Back */

        if (
            value === "back" ||
            value.includes("back to menu")
        ) {
            showMenu();
            return;
        }

        /* Punch */

        if (
            value.includes("punch") ||
            value.includes("attack")
        ) {
            attack();
        }
    }
);

/* ---------- CO-OP MENU ---------- */

function openCoop() {
    const code =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    const choice = prompt(
        "🐧 CO-OP\n\n" +
        "1 = Host a party\n" +
        "2 = Join a party"
    );

    if (choice === "1") {
        alert(
            "🎮 Your party code is:\n\n" +
            code +
            "\n\n" +
            "Up to 4 penguins can join."
        );

        mode = "coop";
        startAdventure();
    }

    if (choice === "2") {
        const joinCode =
            prompt(
                "Enter the party code:"
            );

        if (joinCode) {
            alert(
                "🐧 Joining party " +
                joinCode.toUpperCase()
            );

            mode = "coop";
            startAdventure();
        }
    }
}

/* ---------- PVP ---------- */

function openPvP() {
    const choice = prompt(
        "⚔️ PVP\n\n" +
        "1 = 1v1\n" +
        "2 = Team Battle\n" +
        "3 = Mega Free For All\n\n" +
        "Mega Free For All supports up to 10 penguins."
    );

    if (choice === "1") {
        mode = "pvp";
        startAdventure();
    }

    if (choice === "2") {
        mode = "pvp";
        startAdventure();
    }

    if (choice === "3") {
        mode = "mega";
        startAdventure();

        message(
            "⚠️ Mega Free For All — up to 10 penguins!"
        );
    }
}

/* ---------- LEVEL CREATOR ---------- */

function openCreator() {
    mode = "creator";
    playing = true;

    hideMenu();

    enemies = [];
    boss = null;

    message(
        "🛠️ Level Creator opened!"
    );
}

/* ---------- SHOP ---------- */

function openShop() {
    const choice = prompt(
        "🏪 PENGUIN SHOP\n\n" +
        `Coins: ${coins}\n\n` +
        "1 = Speed upgrade — 50 coins\n" +
        "2 = Health upgrade — 75 coins"
    );

    if (choice === "1") {
        if (coins >= 50) {
            coins -= 50;
            player.speed += 0.5;

            saveCoins();

            message(
                "⚡ Speed upgraded!"
            );
        }
        else {
            message(
                "❌ Not enough coins."
            );
        }
    }

    if (choice === "2") {
        if (coins >= 75) {
            coins -= 75;

            player.maxHp += 20;
            player.hp =
                player.maxHp;

            saveCoins();

            message(
                "❤️ Health upgraded!"
            );
        }
        else {
            message(
                "❌ Not enough coins."
            );
        }
    }
}

/* ---------- FRIENDS ---------- */

function openFriends() {
    const friends =
        JSON.parse(
            localStorage.getItem(
                "penguinFriends"
            ) || "[]"
        );

    const code =
        prompt(
            "👥 FRIENDS\n\n" +
            "Your player code:\n" +
            playerCode() +
            "\n\n" +
            "Current friends: " +
            (friends.length || "None") +
            "\n\n" +
            "Enter a player code to add them, or Cancel."
        );

    if (!code) return;

    if (!friends.includes(code)) {
        friends.push(
            code.toUpperCase()
        );

        localStorage.setItem(
            "penguinFriends",
            JSON.stringify(friends)
        );

        message(
            "✅ Friend added!"
        );
    }
}

function playerCode() {
    let code =
        localStorage.getItem(
            "penguinCode"
        );

    if (!code) {
        code =
            "P-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        localStorage.setItem(
            "penguinCode",
            code
        );
    }

    return code;
}

/* ---------- MESSAGE ---------- */

function message(text) {
    console.log(text);

    const element =
        document.getElementById("toast");

    if (!element) return;

    element.textContent = text;
    element.style.display = "block";

    clearTimeout(
        element.hideTimer
    );

    element.hideTimer =
        setTimeout(() => {
            element.style.display =
                "none";
        }, 2000);
}

/* ---------- INITIALIZATION ---------- */

if (canvas) {
    console.log(
        "🐧 Penguin Adventure canvas found!"
    );
}
else {
    console.error(
        "❌ Canvas #game was not found."
    );
}

console.log(
    "🐧 Penguin Adventure loaded!"
);

console.log(
    "Player code:",
    playerCode()
);

draw();