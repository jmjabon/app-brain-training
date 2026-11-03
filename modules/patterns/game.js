const TIME_LIMIT = 60;
let timeRemaining = TIME_LIMIT;
let timerInterval;
let currentAnswer = null; // Puede ser true/false o un número
let currentInput = "";
let streak = 0;
let correctCount = 0;
let wrongCount = 0;
let activeMode = "div3";

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
const controlsBinary = document.getElementById('controls-yesno');
const controlsKeypad = document.getElementById('controls-keypad');

const theoryData = {
    "div3": {
        title: "Regla del 3",
        html: `
            <p style="margin-bottom:10px;">Un número es divisible por 3 si <strong>la suma de sus cifras</strong> también lo es.</p>
            <ul style="padding-left: 20px; margin-bottom:15px; color: var(--text-sec);">
                <li>Ej: <strong>342</strong> ➔ 3+4+2 = 9.</li>
                <li>Como 9 está en la tabla del 3, 342 es divisible.</li>
            </ul>
        `
    },
    "div4": {
        title: "Regla del 4",
        html: `
            <p style="margin-bottom:10px;">Un número es divisible por 4 si sus <strong>dos últimas cifras</strong> son 00 o un múltiplo de 4.</p>
            <ul style="padding-left: 20px; margin-bottom:15px; color: var(--text-sec);">
                <li>Ej: 5.7<strong>16</strong> ➔ 16 es divisible por 4.</li>
                <li>Por lo tanto, 5.716 es divisible.</li>
            </ul>
        `
    },
    "series": {
        title: "Saltos Ocultos",
        html: `
            <p style="margin-bottom:10px;">Detecta el patrón lógico para predecir el siguiente número.</p>
            <ul style="padding-left: 20px; margin-bottom:15px; color: var(--text-sec);">
                <li>Ej: 2, 5, 8, 11, <strong>_</strong></li>
                <li>El salto constante es +3. La respuesta es 14.</li>
            </ul>
        `
    },
    "div5": {
        title: "Regla del 5",
        html: `
            <p style="margin-bottom:10px;">Un número es divisible por 5 si su <strong>última cifra</strong> es 0 o 5.</p>
            <ul style="padding-left: 20px; margin-bottom:15px; color: var(--text-sec);">
                <li>Ej: 14.89<strong>5</strong> ➔ Termina en 5.</li>
                <li>Por lo tanto, es divisible por 5.</li>
            </ul>
        `
    },
    "div6": {
        title: "Regla del 6",
        html: `
            <p style="margin-bottom:10px;">Para ser divisible por 6, tiene que cumplir dos reglas a la vez: ser par (divisible por 2) y la suma de sus cifras debe estar en la tabla del 3 (divisible por 3).</p>
            <ul style="padding-left: 20px; margin-bottom:15px; color: var(--text-sec);">
                <li>Ej: <strong>312</strong> ➔ Es par. Y 3+1+2 = 6.</li>
                <li>Cumple ambas, es divisible por 6.</li>
            </ul>
        `
    },
    "div9": {
        title: "Regla del 9",
        html: `
            <p style="margin-bottom:10px;">Igual que la regla del 3: un número es divisible por 9 si <strong>la suma de todas sus cifras</strong> da un múltiplo de 9.</p>
            <ul style="padding-left: 20px; margin-bottom:15px; color: var(--text-sec);">
                <li>Ej: <strong>7.812</strong> ➔ 7+8+1+2 = 18.</li>
                <li>18 es múltiplo de 9, así que el número original también lo es.</li>
            </ul>
        `
    }
};

// 1. Navegación
document.querySelectorAll('.module-btn').forEach(btn => {
    btn.onclick = (e) => {
        document.querySelectorAll('.module-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeMode = e.currentTarget.dataset.mode;
    };
});

document.getElementById('btn-to-theory').onclick = () => {
    document.getElementById('theory-title').innerText = theoryData[activeMode].title;
    document.getElementById('theory-desc').innerHTML = theoryData[activeMode].html;
    screens.setup.classList.remove('active');
    screens.theory.classList.add('active');
};

document.getElementById('btn-back-setup').onclick = () => {
    screens.theory.classList.remove('active');
    screens.setup.classList.add('active');
};

document.getElementById('btn-start').onclick = startGame;

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
    
    // Alternar Interfaz
    if (activeMode === "series") {
        controlsBinary.style.display = "none";
        controlsKeypad.style.display = "grid";
        inputEl.style.display = "block";
    } else {
        controlsBinary.style.display = "flex";
        controlsKeypad.style.display = "none";
        inputEl.style.display = "none"; // En modo V/F no tecleamos
    }
    
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
    if (activeMode === "series") inputEl.innerText = currentInput || "_";
}

function generateProblem() {
    currentInput = "";
    updateUI();
    probEl.classList.remove('flash-green', 'flash-red');
    
    if (activeMode === "div3") {
        const num = Math.floor(Math.random() * 9000) + 1000; // 4 cifras
        const sum = num.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        
        // 40% de probabilidades de forzar que SÍ sea divisible
        let finalNum = num;
        if (Math.random() < 0.4 && sum % 3 !== 0) {
            const remainder = sum % 3;
            finalNum += (3 - remainder); // Ajustar para que sea divisible
        }
        
        const finalSum = finalNum.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        currentAnswer = (finalSum % 3 === 0);
        probEl.innerText = finalNum.toLocaleString('es-ES');
        
    } else if (activeMode === "div4") {
        const num = Math.floor(Math.random() * 90000) + 10000; // 5 cifras
        let finalNum = num;
        
        if (Math.random() < 0.4) {
            // Forzar divisibilidad
            const remainder = finalNum % 4;
            if (remainder !== 0) finalNum += (4 - remainder);
        }
        currentAnswer = (finalNum % 4 === 0);
        probEl.innerText = finalNum.toLocaleString('es-ES');
        
    } else if (activeMode === "series") {
        const type = Math.random();
        const start = Math.floor(Math.random() * 10) + 1;
        
        if (type < 0.5) {
            // Suma
            const step = Math.floor(Math.random() * 8) + 2;
            currentAnswer = start + (step * 3);
            probEl.innerText = `${start}, ${start + step}, ${start + step*2}, _`;
        } else {
            // Multiplicación suave
            const step = Math.floor(Math.random() * 2) + 2; // x2 o x3
            currentAnswer = start * Math.pow(step, 3);
            probEl.innerText = `${start}, ${start * step}, ${start * Math.pow(step, 2)}, _`;
        }
    } else if (activeMode === "div5") {
        const num = Math.floor(Math.random() * 90000) + 10000; 
        let finalNum = num;
        
        if (Math.random() < 0.5) {
            // Forzar que termine en 0 o 5
            const lastDigit = Math.random() < 0.5 ? 0 : 5;
            finalNum = parseInt(finalNum.toString().slice(0, -1) + lastDigit);
        }
        
        const endsWith = finalNum % 10;
        currentAnswer = (endsWith === 0 || endsWith === 5);
        probEl.innerText = finalNum.toLocaleString('es-ES');
        
    } else if (activeMode === "div6") {
        const num = Math.floor(Math.random() * 900) + 100; // 3 cifras para cálculo rápido
        let finalNum = num;
        
        if (Math.random() < 0.4) {
            const remainder = finalNum % 6;
            if (remainder !== 0) finalNum += (6 - remainder);
        }
        
        currentAnswer = (finalNum % 6 === 0);
        probEl.innerText = finalNum.toLocaleString('es-ES');
        
    } else if (activeMode === "div9") {
        const num = Math.floor(Math.random() * 9000) + 1000; 
        let finalNum = num;
        
        if (Math.random() < 0.4) {
            const sum = finalNum.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
            const remainder = sum % 9;
            if (remainder !== 0) finalNum += (9 - remainder);
        }
        
        const finalSum = finalNum.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        currentAnswer = (finalSum % 9 === 0);
        probEl.innerText = finalNum.toLocaleString('es-ES');
    }
}

// 3. Controles
// Botones Binarios (Sí/No)
document.getElementById('btn-yes').addEventListener('touchstart', (e) => { e.preventDefault(); handleBinaryResponse(true); }, {passive: false});
document.getElementById('btn-no').addEventListener('touchstart', (e) => { e.preventDefault(); handleBinaryResponse(false); }, {passive: false});
document.getElementById('btn-yes').addEventListener('mousedown', () => handleBinaryResponse(true));
document.getElementById('btn-no').addEventListener('mousedown', () => handleBinaryResponse(false));

function handleBinaryResponse(guess) {
    if (activeMode === "series") return;
    if (guess === currentAnswer) {
        processHit();
    } else {
        processMiss();
    }
}

// Teclado (Series)
document.querySelectorAll('.key').forEach(btn => {
    const handlePress = (e) => {
        if(e.cancelable) e.preventDefault();
        
        if (btn.id === 'key-del') {
            currentInput = currentInput.slice(0, -1);
        } else if (btn.id === 'key-enter') {
            if (currentInput !== "") {
                if (parseInt(currentInput) === currentAnswer) processHit();
                else processMiss();
            }
        } else {
            if (currentInput.length < 5) currentInput += btn.dataset.val;
        }
        updateUI();
    };
    
    btn.addEventListener('touchstart', handlePress, {passive: false});
    btn.addEventListener('mousedown', handlePress);
});

function processHit() {
    probEl.classList.add('flash-green');
    streak++;
    correctCount++;
    setTimeout(generateProblem, 200);
}

function processMiss() {
    probEl.classList.add('flash-red');
    streak = 0;
    wrongCount++;
    currentInput = "";
    updateUI();
    setTimeout(() => probEl.classList.remove('flash-red'), 300);
}

// 4. Resultados y Guardado en el Hub Principal
function endGame() {
    clearInterval(timerInterval);
    screens.game.classList.remove('active');
    screens.result.classList.add('active');
    
    document.getElementById('res-correct').innerText = correctCount;
    document.getElementById('res-wrong').innerText = wrongCount;
    
    // Conexión con el anillo de actividad del menú principal
    const today = new Date().toDateString();
    let activity = JSON.parse(localStorage.getItem('brainActivity')) || {};
    if (activity.date !== today) activity = { date: today, sessions: 0 };
    
    activity.sessions += 1;
    localStorage.setItem('brainActivity', JSON.stringify(activity));
}