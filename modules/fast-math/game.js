const TIME_LIMIT = 60;
let timeRemaining = TIME_LIMIT;
let timerInterval;
let currentAnswer = 0;
let currentInput = "";
let streak = 0;
let correctCount = 0;
let wrongCount = 0;
let activeTrick = "";

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

const theoryData = {
    "11": {
        title: "El Truco del 11",
        desc: "Para multiplicar un número de dos cifras por 11, separa los dos dígitos y coloca su suma en el centro.",
        ex: "42 x 11<br><span style='color: var(--text-sec); font-size: 18px;'>4 _ 2 ➔ 4 (4+2) 2</span><br><span style='color: var(--accent);'>462</span>"
    },
    "sq5": {
        title: "Cuadrados terminados en 5",
        desc: "Multiplica el primer dígito por su número consecutivo, y añade siempre 25 al final.",
        ex: "65²<br><span style='color: var(--text-sec); font-size: 18px;'>6 x 7 = 42</span><br><span style='color: var(--accent);'>4225</span>"
    },
    "mul5": {
        title: "Multiplicar por 5",
        desc: "Multiplicar por 5 es lo mismo que dividir entre 2 y multiplicar por 10 (añadir un cero).",
        ex: "428 x 5<br><span style='color: var(--text-sec); font-size: 18px;'>428 ÷ 2 = 214</span><br><span style='color: var(--accent);'>2140</span>"
    },
    "near100": {
        title: "Cercanos a 100",
        desc: "Resta a 100 cada número. Resta cruzado para los primeros dos dígitos. Multiplica las diferencias para los dos últimos.",
        ex: "98 x 97<br><span style='color: var(--text-sec); font-size: 18px;'>(100-98=2) y (100-97=3)<br>98 - 3 = 95 | 2 x 3 = 06</span><br><span style='color: var(--accent);'>9506</span>"
    },
    "div5": {
        title: "Dividir entre 5",
        desc: "Dividir entre 5 es lo mismo que multiplicar por 2 y quitar un cero (dividir entre 10).",
        ex: "420 ÷ 5<br><span style='color: var(--text-sec); font-size: 18px;'>420 x 2 = 840 ➔ 840 ÷ 10</span><br><span style='color: var(--accent);'>84</span>"
    },
    "mul9": {
        title: "Multiplicar por 9",
        desc: "Añade un cero (multiplica por 10) y réstale el número original.",
        ex: "45 x 9<br><span style='color: var(--text-sec); font-size: 18px;'>450 - 45</span><br><span style='color: var(--accent);'>405</span>"
    },
    "mul15": {
        title: "Multiplicar por 15",
        desc: "Multiplica el número por 10 (añade un cero) y súmale la mitad de ese resultado.",
        ex: "24 x 15<br><span style='color: var(--text-sec); font-size: 18px;'>240 + 120</span><br><span style='color: var(--accent);'>360</span>"
    }
};

// 1. Navegación
document.querySelectorAll('.module-btn').forEach(btn => {
    btn.onclick = (e) => {
        activeTrick = e.currentTarget.dataset.trick;
        document.getElementById('theory-title').innerText = theoryData[activeTrick].title;
        document.getElementById('theory-desc').innerText = theoryData[activeTrick].desc;
        document.getElementById('theory-example').innerHTML = theoryData[activeTrick].ex;
        
        screens.setup.classList.remove('active');
        screens.theory.classList.add('active');
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
    
    let a, b;
    if (activeTrick === "11") {
        a = Math.floor(Math.random() * 89) + 10; 
        currentAnswer = a * 11;
        probEl.innerText = `${a} × 11`;
    } else if (activeTrick === "sq5") {
        a = (Math.floor(Math.random() * 9) + 1) * 10 + 5; 
        currentAnswer = a * a;
        probEl.innerText = `${a}²`;
    } else if (activeTrick === "mul5") {
        a = (Math.floor(Math.random() * 499) + 10) * 2; 
        currentAnswer = a * 5;
        probEl.innerText = `${a} × 5`;
    } else if (activeTrick === "near100") {
        a = Math.floor(Math.random() * 9) + 91; 
        b = Math.floor(Math.random() * 9) + 91;
        currentAnswer = a * b;
        probEl.innerText = `${a} × ${b}`;
    } else if (activeTrick === "div5") {
        // Generamos un resultado exacto primero para evitar decimales táctiles
        currentAnswer = Math.floor(Math.random() * 150) + 10; 
        a = currentAnswer * 5;
        probEl.innerText = `${a} ÷ 5`;
    } else if (activeTrick === "mul9") {
        a = Math.floor(Math.random() * 89) + 11; 
        currentAnswer = a * 9;
        probEl.innerText = `${a} × 9`;
    } else if (activeTrick === "mul15") {
        // Forzamos números pares para que la mitad sea exacta y rápida de sumar
        a = (Math.floor(Math.random() * 45) + 5) * 2; 
        currentAnswer = a * 15;
        probEl.innerText = `${a} × 15`;
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
    document.getElementById('result-message').innerText = accuracy > 80 ? "¡El atajo se está automatizando en tu cerebro!" : "Céntrate en el patrón. La velocidad llegará después.";
    
    // Conexión con el anillo de actividad del menú principal
    const today = new Date().toDateString();
    let activity = JSON.parse(localStorage.getItem('brainActivity')) || {};
    if (activity.date !== today) activity = { date: today, sessions: 0 };
    
    activity.sessions += 1;
    localStorage.setItem('brainActivity', JSON.stringify(activity));
}