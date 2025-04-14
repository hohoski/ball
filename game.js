const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let ruleShown = false; // 규칙 안내가 아직 안 보였는지

// 게임 상태
let ball;
let score = 0;
let lastScore = null;
const GAME_TIME_LIMIT = 30;
let remainingTime = GAME_TIME_LIMIT;
let timerInterval = null;
let itemInterval = null;
let powerInterval = null;
let gameStarted = false;
let stageCleared = false;
let hoveredButton = null;

// 스테이지 관련
let stage = 1;
let goalScore = 30;
function getGoalScore(stage) {
    return 30 + (stage - 1) * 20;
}

// 오브젝트 데이터
const items = [];
const powerItems = [];
const obstacles = [];
const itemColors = ['#fff700', '#00ff00', '#00ffff', '#ff00ff', '#ff0000'];

let speedLevel = 0;
let sizeLevel = 0;

const BUTTONS = {
    start: { x: 0, y: 0, w: 180, h: 40 },
    reset: { x: 0, y: 0, w: 120, h: 30 }
};

// -------------------- 초기화 및 생성 함수 --------------------

function resetGame() {
    const baseSpeed = 3;
    const baseRadius = 20;

    const speedMultiplier = Math.pow(1.05, speedLevel);
    const radiusMultiplier = Math.pow(1.05, sizeLevel);

    ball = {
        x: width / 2,
        y: height / 2,
        radius: baseRadius * radiusMultiplier,
        dx: baseSpeed * speedMultiplier,
        dy: baseSpeed * speedMultiplier,
        color: 'deepskyblue'
    };

    score = 0;
    remainingTime = GAME_TIME_LIMIT;
    goalScore = getGoalScore(stage);
    items.length = 0;
    powerItems.length = 0;
    obstacles.length = 0;

    clearInterval(timerInterval);
    clearInterval(itemInterval);
    clearInterval(powerInterval);

    spawnObstacles();
}

function spawnItems() {
    for (let i = 0; i < 10; i++) {
        const value = Math.ceil(Math.random() * 5);
        const radius = 8 + value * 2;
        const x = Math.random() * (width - radius * 2) + radius;
        const y = Math.random() * (height - radius * 2) + radius;
        items.push({ x, y, radius, value, color: itemColors[value - 1] });
    }
}

function spawnPowerItem() {
    const types = ['speedUp', 'bigBall', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerItems.push({
        x: Math.random() * (width - 40) + 20,
        y: Math.random() * (height - 40) + 20,
        radius: 20,
        type,
        color: type === 'speedUp' ? '#00f' : type === 'bigBall' ? '#f0f' : '#f00'
    });
}

function spawnObstacles() {
    obstacles.length = 0;
    const count = Math.max(0, stage - 1);

    for (let i = 0; i < count; i++) {
        const w = 60;
        const h = 20;
        const x = Math.random() * (width - w);
        const y = Math.random() * (height - h);
        obstacles.push({ x, y, width: w, height: h });
    }
}

// -------------------- 충돌 / 효과 --------------------

function isColliding(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < a.radius + b.radius;
}

function isCollidingWithObstacle(ball, obs) {
    const closestX = Math.max(obs.x, Math.min(ball.x, obs.x + obs.width));
    const closestY = Math.max(obs.y, Math.min(ball.y, obs.y + obs.height));
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    return Math.sqrt(dx * dx + dy * dy) < ball.radius;
}

function updatePowerEffects() {
    for (let i = powerItems.length - 1; i >= 0; i--) {
        if (isColliding(ball, powerItems[i])) {
            const item = powerItems[i];
            powerItems.splice(i, 1);

            if (item.type === 'speedUp') {
                ball.dx *= 1.05;
                ball.dy *= 1.05;
                speedLevel++;
            }
            if (item.type === 'bigBall') {
                ball.radius *= 1.05;
                sizeLevel++;
            }
            if (item.type === 'bomb') {
                items.forEach(it => score += it.value);
                items.length = 0;
            }
        }
    }
}

// -------------------- 게임 상태 업데이트 --------------------

function update() {
    if (!gameStarted) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.radius > width || ball.x - ball.radius < 0) ball.dx *= -1;
    if (ball.y + ball.radius > height || ball.y - ball.radius < 0) ball.dy *= -1;

    for (let i = items.length - 1; i >= 0; i--) {
        if (isColliding(ball, items[i])) {
            score += items[i].value;
            items.splice(i, 1);
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (isCollidingWithObstacle(ball, obstacles[i])) {
            obstacles.splice(i, 1);
            ball.dx *= 0.95;
            ball.dy *= 0.95;
            ball.radius *= 0.95;
            if (speedLevel > 0) speedLevel--;
            if (sizeLevel > 0) sizeLevel--;
        }
    }

    updatePowerEffects();
}

// -------------------- 그리기 --------------------

function drawBall() {
    if (!gameStarted) return;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function drawItems() {
    items.forEach(item => {
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.closePath();
    });
}

function drawPowerItems() {
    powerItems.forEach(item => {
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.type.toUpperCase(), item.x, item.y + 4);
    });
}

function drawObstacles() {
    ctx.fillStyle = '#888';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
}

function drawScore() {
    if (!gameStarted) {
        drawUI();
        return;
    }

    const padding = 10;
    const lineHeight = 28;
    const lines = [
        `Score: ${score}`,
        `Time: ${remainingTime}s`,
        `Speed Lv: ${speedLevel}`,
        `Size Lv: ${sizeLevel}`,
        `Stage: ${stage}`,
        `Goal: ${goalScore}점`,
    ];

    const boxX = 15;
    const boxY = 15;
    const boxWidth = 180;
    const boxHeight = lines.length * lineHeight + padding * 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    lines.forEach((text, i) => {
        ctx.fillText(text, boxX + padding, boxY + padding + i * lineHeight);
    });
}

function drawUI() {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';

    if (!ruleShown) {
        drawRules(centerX, centerY);
        BUTTONS.start.x = centerX - 80;
        BUTTONS.start.y = centerY + 180;
        return;
    }

    if (stageCleared) {
        ctx.fillText(`🎉 STAGE ${stage} CLEAR!`, centerX, centerY - 100);
        ctx.fillText(`▶ Click to Start Stage ${stage + 1}`, centerX, centerY - 50);
        BUTTONS.start.x = centerX - 90;
        BUTTONS.start.y = centerY - 70;
    } else {
        ctx.fillText(`▶ Click to Start`, centerX, centerY - 30);
        BUTTONS.start.x = centerX - 80;
        BUTTONS.start.y = centerY - 50;
    }

    drawScoreHistory(centerX, centerY + 10);
    // reset 버튼 그대로
}

function drawRules(cx, cy) {
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 Game Rules', cx, cy - 140);

    const lines = [
        '1. 제한 시간 안에 목표 점수를 달성하세요!',
        '2. 점수 아이템을 먹으면 점수가 올라요 (1~5점)',
        '3. 파워 아이템:',
        '- SpeedUp: 속도 증가',
        '- BigBall: 크기 증가',
        '- Bomb: 모든 점수 아이템 획득',
        '4. 장애물에 닿으면 속도/크기 감소, 레벨 하락',
        '5. 목표 점수 달성 시 다음 스테이지로!'
    ];

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    lines.forEach((line, i) => {
        ctx.fillText(line, cx - 150, cy - 100 + i * 22);
    });

    // 시작 버튼 안내
    ctx.textAlign = 'center';
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('▶ 게임 시작', cx, cy + 200);
}



function drawScoreHistory(cx, cy) {
    let history = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
    const sorted = history.sort((a, b) => b.score - a.score);
    const best = sorted[0]?.score || 0;

    ctx.fillStyle = '#aaa';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';

    ctx.fillText(`🏆 BEST: ${best}점`, cx, cy);
    ctx.fillText('Score History (Top 5):', cx, cy + 20);

    sorted.slice(0, 5).forEach((entry, i) => {
        const isRecent = entry.score === lastScore;
        ctx.fillStyle = isRecent ? '#0f0' : '#aaa';
        const date = new Date(entry.date);
        const dateStr = isNaN(date.getTime()) ? '-' : date.toLocaleString();
        ctx.fillText(`${i + 1}. ${entry.score}점 - ${dateStr}`, cx, cy + 45 + i * 20);
    });
}

// -------------------- 인터랙션 및 루프 --------------------

function saveScoreToHistory() {
    const history = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
    const entry = { score, date: new Date().toISOString() };
    history.push(entry);
    localStorage.setItem('scoreHistory', JSON.stringify(history));
    lastScore = score;
}

function startGame() {
    if (gameStarted) return;
    resetGame();
    gameStarted = true;
    stageCleared = false;

    spawnItems();
    itemInterval = setInterval(spawnItems, 5000);
    powerInterval = setInterval(spawnPowerItem, 8000);

    timerInterval = setInterval(() => {
        remainingTime--;
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            clearInterval(itemInterval);
            clearInterval(powerInterval);

            if (score >= goalScore) {
                stageCleared = true;
                gameStarted = false;
            } else {
                saveScoreToHistory();
                gameStarted = false;
            }
        }
    }, 1000);
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!gameStarted) {
        if (!ruleShown) {
            if (
                x >= BUTTONS.start.x &&
                x <= BUTTONS.start.x + BUTTONS.start.w &&
                y >= BUTTONS.start.y &&
                y <= BUTTONS.start.y + BUTTONS.start.h
            ) {
                ruleShown = true;
                return;
            }
        }

        if (
            x >= BUTTONS.reset.x && x <= BUTTONS.reset.x + BUTTONS.reset.w &&
            y >= BUTTONS.reset.y && y <= BUTTONS.reset.y + BUTTONS.reset.h
        ) {
            localStorage.removeItem('scoreHistory');
            lastScore = null;
            return;
        }

        if (
            stageCleared &&
            x >= BUTTONS.start.x && x <= BUTTONS.start.x + BUTTONS.start.w &&
            y >= BUTTONS.start.y && y <= BUTTONS.start.y + BUTTONS.start.h
        ) {
            stage++;
            stageCleared = false;
            startGame();
            return;
        }

        if (
            !stageCleared &&
            x >= BUTTONS.start.x && x <= BUTTONS.start.x + BUTTONS.start.w &&
            y >= BUTTONS.start.y && y <= BUTTONS.start.y + BUTTONS.start.h
        ) {
            startGame();
            return;
        }
    }

    if (gameStarted) moveTo(x, y);
});


canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!gameStarted) {
        if (
            x >= BUTTONS.reset.x && x <= BUTTONS.reset.x + BUTTONS.reset.w &&
            y >= BUTTONS.reset.y && y <= BUTTONS.reset.y + BUTTONS.reset.h
        ) {
            hoveredButton = 'reset';
            canvas.style.cursor = 'pointer';
        } else {
            hoveredButton = null;
            canvas.style.cursor = 'default';
        }
    }
});

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

function moveTo(x, y) {
    const angle = Math.atan2(y - ball.y, x - ball.x);
    const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
    ball.dx = Math.cos(angle) * speed;
    ball.dy = Math.sin(angle) * speed;
}

function gameLoop() {
    ctx.clearRect(0, 0, width, height);
    update();
    drawBall();
    drawItems();
    drawPowerItems();
    drawObstacles();
    drawScore();
    requestAnimationFrame(gameLoop);
}

gameLoop();
