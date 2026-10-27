// Constantes y Estado
let difficulty = 'easy'; // easy, medium, hard
let timeLimit = 60;
let timeRemaining = 60;
let timerInterval;
let currentAnswer = 0;
let currentInput = "";
let score = 0;
let correctCount = 0;
let wrongCount = 0;

// Elementos del DOM
const screens = {
    setup: document.getElementById('setup-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};
const probEl = document.getElementById('math-problem');
const inputEl = document.getElementById('user-input');
const timeEl = document.getElementById('time-indicator');
const scoreEl = document.getElementById('score-indicator');

// --- UI CONFIGURACIÓN ---
document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.onclick = (e) => {
        const parent = e.target.parentElement;
        parent.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        if (e.target.dataset.diff) difficulty = e.target.dataset.diff;
        if (e.target.dataset.time) timeLimit = parseInt(e.target.dataset.time);
    };
});

document.getElementById('btn-start').onclick = startGame;
document.getElementById('btn-play-again').onclick = () => {
    screens.result.classList.remove('active');
    screens.setup.classList.add('active');
};
document.getElementById('btn-close-game').onclick = () => {
    clearInterval(timerInterval);
    screens.game.classList.remove('active');
    screens.setup.classList.add('active');
};

// --- MOTOR DEL JUEGO ---
function startGame() {
    score = 0; correctCount = 0; wrongCount = 0;
    timeRemaining = timeLimit;
    currentInput = "";
    updateScoreUI();
    updateTimeUI();
    
    screens.setup.classList.remove('active');
    screens.game.classList.add('active');
    
    generateProblem();
    timerInterval = setInterval(gameTick, 1000);
}

function gameTick() {
    timeRemaining--;
    updateTimeUI();
    if (timeRemaining <= 0) endGame();
}

function updateTimeUI() {
    const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const s = (timeRemaining % 60).toString().padStart(2, '0');
    timeEl.innerText = `${m}:${s}`;
}

function updateScoreUI() {
    scoreEl.innerText = `Puntos: ${score}`;
    inputEl.innerText = currentInput || "_";
}

// --- GENERADOR DE PROBLEMAS ---
function generateProblem() {
    currentInput = "";
    updateScoreUI();
    
    let a, b, op, ops;
    
    if (difficulty === 'easy') {
        ops = ['+', '-'];
        op = ops[Math.floor(Math.random() * ops.length)];
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        if (op === '-' && a < b) [a, b] = [b, a]; // Evita negativos en fácil
    } 
    else if (difficulty === 'medium') {
        ops = ['+', '-', '*'];
        op = ops[Math.floor(Math.random() * ops.length)];
        if (op === '*') {
            a = Math.floor(Math.random() * 12) + 2;
            b = Math.floor(Math.random() * 12) + 2;
        } else {
            a = Math.floor(Math.random() * 100) + 10;
            b = Math.floor(Math.random() * 50) + 10;
            if (op === '-' && a < b) [a, b] = [b, a];
        }
    } 
    else { // Hard (incluye divisiones exactas y números mayores)
        ops = ['+', '-', '*', '/'];
        op = ops[Math.floor(Math.random() * ops.length)];
        if (op === '*') {
            a = Math.floor(Math.random() * 20) + 5;
            b = Math.floor(Math.random() * 15) + 5;
        } else if (op === '/') {
            b = Math.floor(Math.random() * 12) + 2;
            currentAnswer = Math.floor(Math.random() * 15) + 2;
            a = b * currentAnswer; // Asegura división exacta
        } else {
            a = Math.floor(Math.random() * 300) + 50;
            b = Math.floor(Math.random() * 200) + 20;
        }
    }
    
    if (op !== '/') {
        if (op === '+') currentAnswer = a + b;
        if (op === '-') currentAnswer = a - b;
        if (op === '*') currentAnswer = a * b;
    }
    
    // Operadores visuales más amigables
    const visualOp = op === '*' ? '×' : (op === '/' ? '÷' : op);
    probEl.innerText = `${a} ${visualOp} ${b}`;
    probEl.classList.remove('flash-green', 'flash-red'); // Resetea animaciones
}

// --- CONTROLES DEL TECLADO ---
document.querySelectorAll('.key').forEach(btn => {
    // Soportar toque y ratón
    const handlePress = (e) => {
        if(e.cancelable) e.preventDefault();
        
        if (btn.id === 'key-del') {
            currentInput = currentInput.slice(0, -1);
        } else if (btn.id === 'key-enter') {
            checkAnswer();
        } else {
            if (currentInput.length < 6) currentInput += btn.dataset.val;
        }
        updateScoreUI();
    };
    
    btn.addEventListener('touchstart', handlePress, {passive: false});
    btn.addEventListener('mousedown', handlePress);
});

function checkAnswer() {
    if (currentInput === "") return;
    
    const parsedInput = parseInt(currentInput);
    if (parsedInput === currentAnswer) {
        // Acierto: animar, sumar puntos según dificultad y generar otro
        probEl.classList.add('flash-green');
        let points = difficulty === 'easy' ? 10 : (difficulty === 'medium' ? 20 : 35);
        score += points;
        correctCount++;
        setTimeout(generateProblem, 200);
    } else {
        // Fallo: animar en rojo, borrar input
        probEl.classList.add('flash-red');
        wrongCount++;
        currentInput = "";
        updateScoreUI();
        setTimeout(() => probEl.classList.remove('flash-red'), 300);
    }
}

// --- RESULTADOS Y GUARDADO ---
function endGame() {
    clearInterval(timerInterval);
    screens.game.classList.remove('active');
    screens.result.classList.add('active');
    
    document.getElementById('res-correct').innerText = correctCount;
    document.getElementById('res-wrong').innerText = wrongCount;
    document.getElementById('res-score').innerText = score;
    
    let msg = score > 100 ? "¡Cálculo veloz! Tu atención ejecutiva está a tope." : "Buen calentamiento. La precisión es mejor que la velocidad al principio.";
    document.getElementById('result-message').innerText = msg;
    
    // Guardar sesión para el Hub (Anillo de Actividad)
    const today = new Date().toDateString();
    let activity = JSON.parse(localStorage.getItem('brainActivity')) || {};
    if (activity.date !== today) activity = { date: today, sessions: 0 };
    
    activity.sessions += 1;
    localStorage.setItem('brainActivity', JSON.stringify(activity));
}