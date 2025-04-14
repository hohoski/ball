const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

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

// 아이템
const items = [];
const itemColors = ['#fff700', '#00ff00', '#00ffff', '#ff00ff', '#ff0000'];
let powerItems = [];

// 레벨
let speedLevel = 0;
let sizeLevel = 0;

// 장애물
const obstacles = []; // 👈 장애물 배열

// 버튼 위치 정의
const BUTTONS = {
    start: { x: 0, y: 0, w: 180, h: 40 },
    reset: { x: 0, y: 0, w: 120, h: 30 },
    pause: { x: width - 100, y: 20, w: 80, h: 30 } // (표시만, 기능 없음)
};

// ✅ 기본 공, 속도/크기 레벨 반영해 초기화
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

    spawnObstacles(); // ✅ 장애물도 같이 생성
}

// ✅ 아이템 생성 (1~5점짜리 10개)
function spawnItems() {
    for (let i = 0; i < 10; i++) {
        const value = Math.ceil(Math.random() * 5);
        const radius = 8 + value * 2;
        const x = Math.random() * (width - radius * 2) + radius;
        const y = Math.random() * (height - radius * 2) + radius;
        items.push({ x, y, radius, value, color: itemColors[value - 1] });
    }
}

// ✅ 파워 아이템 생성 (speedUp, bigBall, bomb 중 하나)
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

// ✅ 장애물 생성 (스테이지 - 1 개)
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

// ✅ 파워아이템 효과 적용
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


function moveTo(x, y) {
    const angle = Math.atan2(y - ball.y, x - ball.x);
    const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
    ball.dx = Math.cos(angle) * speed;
    ball.dy = Math.sin(angle) * speed;
}

function isColliding(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < a.radius + b.radius;
}

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
    updatePowerEffects();
}

// 그리기
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

    // 💠 배경 박스
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 텍스트
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

    ctx.font = '28px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';

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

    drawScoreHistory(centerX, centerY + 10); // ✅ 위치 넘겨줌

    // 버튼
    BUTTONS.reset.x = centerX - 60;
    BUTTONS.reset.y = centerY + 200;

    ctx.fillStyle = hoveredButton === 'reset' ? '#555' : '#111';
    ctx.fillRect(BUTTONS.reset.x, BUTTONS.reset.y, BUTTONS.reset.w, BUTTONS.reset.h);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(BUTTONS.reset.x, BUTTONS.reset.y, BUTTONS.reset.w, BUTTONS.reset.h);

    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
        '기록 초기화',
        BUTTONS.reset.x + BUTTONS.reset.w / 2,
        BUTTONS.reset.y + BUTTONS.reset.h / 2
    );
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

// 마우스 이벤트
canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!gameStarted) {
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

    if (gameStarted) {
        moveTo(x, y);
    }
});

// 기타
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
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

function gameLoop() {
    ctx.clearRect(0, 0, width, height);
    update();
    drawBall();
    drawItems();
    drawPowerItems();
    drawScore();
    requestAnimationFrame(gameLoop);
}

gameLoop();
