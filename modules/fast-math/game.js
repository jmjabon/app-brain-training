const TIME_LIMIT = 60;
let timeRemaining = TIME_LIMIT;
let timerInterval;
let currentAnswer = 0;
let currentInput = "";
let streak = 0;
let correctCount = 0;
let wrongCount = 0;
let activeTrick = "11";

const screens = {
    setup: document.getElementById('setup-screen'),
    theory: document.getElementById('theory-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

const probEl = document.getElementById('math-problem');
const inputEl = document.getElementById('user-input');
const timeEl = document.getElementById('time-indicator');
const scoreEl = document.getElementById('score-indicator');

// 1. Navegación
document.querySelectorAll('.module-btn').forEach(btn => {
    btn.onclick = (e) => {
        activeTrick = e.currentTarget.dataset.trick;
        if(activeTrick === "11") {
            screens.setup.classList.remove('active');
            screens.theory.classList.add('active');
        }
    };
});

document.getElementById('btn-start-drill').onclick = startGame;
document.getElementById('btn-play-again').onclick = () => {
    screens.result.classList.remove('active');
    screens.theory.classList.add('active');
};
document.getElementById('btn-close-game').onclick = () => {
    clearInterval(timerInterval);
    screens.game.classList.remove('active');
    screens.setup.classList.add('active');
};

// 2. Motor de Juego
function startGame() {
    streak = 0; correctCount = 0; wrongCount = 0;
    timeRemaining = TIME_LIMIT;
    currentInput = "";
    updateUI();
    
    screens.theory.classList.remove('active');
    screens.game.classList.add('active');
    
    generateProblem();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateUI();
        if (timeRemaining <= 0) endGame();
    }, 1000);
}

function updateUI() {
    const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const s = (timeRemaining % 60).toString().padStart(2, '0');
    timeEl.innerText = `${m}:${s}`;
    scoreEl.innerText = `Racha: ${streak}`;
    inputEl.innerText = currentInput || "_";
}

function generateProblem() {
    currentInput = "";
    updateUI();
    
    if (activeTrick === "11") {
        // Generar un número de 2 cifras aleatorio
        const a = Math.floor(Math.random() * 90) + 10; 
        currentAnswer = a * 11;
        probEl.innerText = `${a} × 11`;
    }
    probEl.classList.remove('flash-green', 'flash-red');
}

// 3. Controles del Teclado
document.querySelectorAll('.key').forEach(btn => {
    const handlePress = (e) => {
        if(e.cancelable) e.preventDefault();
        
        if (btn.id === 'key-del') {
            currentInput = currentInput.slice(0, -1);
        } else if (btn.id === 'key-enter') {
            checkAnswer();
        } else {
            if (currentInput.length < 5) currentInput += btn.dataset.val;
        }
        updateUI();
    };
    
    btn.addEventListener('touchstart', handlePress, {passive: false});
    btn.addEventListener('mousedown', handlePress);
});

function checkAnswer() {
    if (currentInput === "") return;
    
    if (parseInt(currentInput) === currentAnswer) {
        probEl.classList.add('flash-green');
        streak++;
        correctCount++;
        setTimeout(generateProblem, 200);
    } else {
        probEl.classList.add('flash-red');
        streak = 0;
        wrongCount++;
        currentInput = "";
        updateUI();
        setTimeout(() => probEl.classList.remove('flash-red'), 300);
    }
}

// 4. Resultados y Guardado en el Hub Principal
function endGame() {
    clearInterval(timerInterval);
    screens.game.classList.remove('active');
    screens.result.classList.add('active');
    
    document.getElementById('res-correct').innerText = correctCount;
    document.getElementById('res-wrong').innerText = wrongCount;
    
    const accuracy = correctCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
    document.getElementById('result-message').innerText = accuracy > 80 ? "¡El atajo se está automatizando en tu cerebro!" : "Céntrate en separar y sumar. La velocidad llegará después.";
    
    // Conexión con el anillo de actividad del menú principal
    const today = new Date().toDateString();
    let activity = JSON.parse(localStorage.getItem('brainActivity')) || {};
    if (activity.date !== today) activity = { date: today, sessions: 0 };
    
    activity.sessions += 1;
    localStorage.setItem('brainActivity', JSON.stringify(activity));
}