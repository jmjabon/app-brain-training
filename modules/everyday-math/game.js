const TIME_LIMIT = 60;
let timeRemaining = TIME_LIMIT;
let timerInterval;
let currentAnswer = 0;
let currentInput = "";
let streak = 0;
let correctCount = 0;
let wrongCount = 0;
let activeMode = "tips";

const screens = {
    setup: document.getElementById('setup-screen'),
    theory: document.getElementById('theory-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

const ctxEl = document.getElementById('scenario-context');
const probEl = document.getElementById('math-problem');
const inputEl = document.getElementById('user-input');
const timeEl = document.getElementById('time-indicator');
const scoreEl = document.getElementById('score-indicator');

// Datos de la Teoría Cotidiana
const theoryData = {
    "tips": {
        title: "Reglas para Propinas",
        html: `
            <p style="margin-bottom:10px;">La clave es usar el <strong>10%</strong> como base (moviendo la coma una posición a la izquierda).</p>
            <ul style="padding-left: 20px; margin-bottom:15px; color: var(--text-sec);">
                <li><strong>10%</strong> ➔ Ej: 40€ = 4€</li>
                <li><strong>20%</strong> ➔ Doble del 10%. (Ej: 4 x 2 = 8€)</li>
                <li><strong>15%</strong> ➔ 10% + su mitad. (Ej: 4 + 2 = 6€)</li>
            </ul>
        `
    },
    "discounts": {
        title: "Atajos de Rebajas",
        html: `
            <p style="margin-bottom:10px;">Para saber el <strong>precio final</strong>, resta mentalmente el descuento usando fracciones rápidas:</p>
            <ul style="padding-left: 20px; margin-bottom:15px; color: var(--text-sec);">
                <li><strong>50%</strong> ➔ Mitad de precio.</li>
                <li><strong>25%</strong> ➔ Resta una cuarta parte (mitad de la mitad).</li>
                <li><strong>20% o 10%</strong> ➔ Calcula el 10% moviendo la coma y réstalo.</li>
            </ul>
        `
    }
};

// 1. UI Navegación
document.querySelectorAll('.module-btn').forEach(btn => {
    btn.onclick = (e) => {
        document.querySelectorAll('.module-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeMode = e.currentTarget.dataset.mode;
    };
});
document.querySelector('.module-btn[data-mode="tips"]').classList.add('active');

// Navegación Setup -> Teoría
document.getElementById('btn-to-theory').onclick = () => {
    document.getElementById('theory-title').innerText = theoryData[activeMode].title;
    document.getElementById('theory-desc').innerHTML = theoryData[activeMode].html;
    screens.setup.classList.remove('active');
    screens.theory.classList.add('active');
};

// Navegación Teoría -> Setup
document.getElementById('btn-back-setup').onclick = () => {
    screens.theory.classList.remove('active');
    screens.setup.classList.add('active');
};

// Botón Empezar (Desde Teoría)
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

// 2. Motor de Juego (mantén tu startGame, generateScenario, endGame, etc. exactamente igual debajo de esto)
// 2. Motor de Juego
function startGame() {
    streak = 0; correctCount = 0; wrongCount = 0;
    timeRemaining = TIME_LIMIT;
    currentInput = "";
    updateUI();
    
    screens.setup.classList.remove('active');
    screens.game.classList.add('active');
    
    generateScenario();
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
    inputEl.innerText = currentInput ? currentInput + '€' : "_";
}

function generateScenario() {
    currentInput = "";
    updateUI();
    probEl.classList.remove('flash-green', 'flash-red');
    
    if (activeMode === "tips") {
        // Generar cuenta realista (múltiplos de 5 o 10 para hacer la propina mentalmente posible)
        const amount = (Math.floor(Math.random() * 16) + 3) * 5; // De 15€ a 90€
        const tipPercents = [10, 15, 20];
        const tip = tipPercents[Math.floor(Math.random() * tipPercents.length)];
        
        currentAnswer = (amount * tip) / 100;
        ctxEl.innerText = `Restaurante: ${amount}€`;
        probEl.innerText = `Propina del ${tip}%`;
        
    } else if (activeMode === "discounts") {
        // Precios redondos de ropa/tecnología
        const amount = (Math.floor(Math.random() * 20) + 4) * 10; // De 40€ a 230€
        const discounts = [10, 20, 25, 50];
        const discount = discounts[Math.floor(Math.random() * discounts.length)];
        
        const discountValue = (amount * discount) / 100;
        currentAnswer = amount - discountValue;
        
        ctxEl.innerText = `Zapatillas: ${amount}€`;
        probEl.innerText = `Descuento del ${discount}%`;
    }
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
        setTimeout(generateScenario, 250);
    } else {
        probEl.classList.add('flash-red');
        streak = 0;
        wrongCount++;
        currentInput = "";
        updateUI();
        setTimeout(() => probEl.classList.remove('flash-red'), 300);
    }
}

// 4. Final y Guardado
function endGame() {
    clearInterval(timerInterval);
    screens.game.classList.remove('active');
    screens.result.classList.add('active');
    
    document.getElementById('res-correct').innerText = correctCount;
    document.getElementById('res-wrong').innerText = wrongCount;
    
    document.getElementById('result-message').innerText = correctCount > 10 
        ? "¡Excelente estimación! Tu lóbulo parietal está muy ágil." 
        : "Recuerda: para el 15%, calcula el 10% y súmale la mitad.";
    
    // Conexión con el anillo del Menú
    const today = new Date().toDateString();
    let activity = JSON.parse(localStorage.getItem('brainActivity')) || {};
    if (activity.date !== today) activity = { date: today, sessions: 0 };
    
    activity.sessions += 1;
    localStorage.setItem('brainActivity', JSON.stringify(activity));
}