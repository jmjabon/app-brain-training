// Constantes y Estado
const TOTAL_TURNS = 24; // 24 turnos = aprox 1 minuto de juego
const TURN_DURATION = 2500; // 2.5 segundos por turno
const STIMULUS_DURATION = 800; // El cuadrado brilla por 800ms
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'L']; // Letras claras en español

let nLevel = 2;
let mode = 'manual'; // 'manual' o 'auto'
let sequence = [];
let currentTurn = 0;
let gameInterval;
let userResponses = { pos: [], audio: [] };
let synth = window.speechSynthesis;

// Elementos del DOM
const screens = {
    setup: document.getElementById('setup-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

// --- CONFIGURACIÓN UI ---
document.getElementById('btn-inc-n').onclick = () => { nLevel = Math.min(nLevel + 1, 9); updateNUI(); };
document.getElementById('btn-dec-n').onclick = () => { nLevel = Math.max(nLevel - 1, 1); updateNUI(); };

function updateNUI() { document.getElementById('n-value').innerText = nLevel; }

document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.onclick = (e) => {
        document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        mode = e.target.dataset.mode;
    };
});

document.getElementById('btn-start').onclick = () => {
    // 🍏 FIX IOS: Desbloquear el audio en la primera interacción táctil
    let utterance = new SpeechSynthesisUtterance('');
    synth.speak(utterance);
    
    startGame();
};

document.getElementById('btn-play-again').onclick = () => {
    screens.result.classList.remove('active');
    screens.setup.classList.add('active');
};

// --- LÓGICA DEL JUEGO ---
function generateSequence() {
    sequence = [];
    for (let i = 0; i < TOTAL_TURNS; i++) {
        let pos = Math.floor(Math.random() * 9);
        let audio = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        
        // Forzar ~30% de aciertos para asegurar que el juego tenga sentido
        if (i >= nLevel) {
            if (Math.random() < 0.3) pos = sequence[i - nLevel].pos;
            if (Math.random() < 0.3) audio = sequence[i - nLevel].audio;
        }
        sequence.push({ pos, audio });
    }
}

function startGame() {
    generateSequence();
    currentTurn = 0;
    userResponses = { pos: new Array(TOTAL_TURNS).fill(false), audio: new Array(TOTAL_TURNS).fill(false) };
    
    document.getElementById('game-n-indicator').innerText = `N = ${nLevel}`;
    
    screens.setup.classList.remove('active');
    screens.game.classList.add('active');
    
    // Pequeña pausa antes de empezar
    setTimeout(playTurn, 1000); 
}

function playTurn() {
    if (currentTurn >= TOTAL_TURNS) {
        endGame();
        return;
    }

    document.getElementById('game-turn-indicator').innerText = `Turno ${currentTurn + 1} / ${TOTAL_TURNS}`;
    const currentItem = sequence[currentTurn];

    // 1. Mostrar estímulo visual
    const cell = document.getElementById(`cell-${currentItem.pos}`);
    cell.classList.add('active');
    
    // 2. Reproducir estímulo auditivo
    let utterance = new SpeechSynthesisUtterance(currentItem.audio);
    utterance.lang = 'es-ES';
    utterance.rate = 1.2; // Un poco más rápido
    synth.speak(utterance);

    // Apagar visual
    setTimeout(() => { cell.classList.remove('active'); }, STIMULUS_DURATION);

    // Preparar siguiente turno
    currentTurn++;
    gameInterval = setTimeout(playTurn, TURN_DURATION);
}

// --- CONTROLES DE USUARIO ---
// Registramos el click para el turno *anterior* (currentTurn ya se ha incrementado al mostrarse)
document.getElementById('btn-pos').addEventListener('touchstart', (e) => {
    e.preventDefault(); // Evita doble tap
    if (currentTurn > 0) userResponses.pos[currentTurn - 1] = true;
});

document.getElementById('btn-audio').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (currentTurn > 0) userResponses.audio[currentTurn - 1] = true;
});


// --- RESULTADOS ---
function endGame() {
    clearTimeout(gameInterval);
    screens.game.classList.remove('active');
    screens.result.classList.add('active');

    let posCorrect = 0, posPossible = 0;
    let audioCorrect = 0, audioPossible = 0;

    for (let i = nLevel; i < TOTAL_TURNS; i++) {
        const isPosMatch = sequence[i].pos === sequence[i - nLevel].pos;
        const isAudioMatch = sequence[i].audio === sequence[i - nLevel].audio;

        if (isPosMatch) posPossible++;
        if (isAudioMatch) audioPossible++;

        // Aciertos (True Positive) o Aciertos por omisión (True Negative)
        if (isPosMatch && userResponses.pos[i]) posCorrect++;
        else if (!isPosMatch && !userResponses.pos[i]) { /* Podríamos contar los verdaderos negativos, pero mediremos sobre los targets */ }
    }

    // Calcular porcentajes (evitando división por 0)
    let posScore = posPossible > 0 ? Math.round((posCorrect / posPossible) * 100) : 100;
    let audioScore = audioPossible > 0 ? Math.round((audioCorrect / audioPossible) * 100) : 100;
    let totalScore = (posScore + audioScore) / 2;

    document.getElementById('score-pos').innerText = `${posScore}%`;
    document.getElementById('score-audio').innerText = `${audioScore}%`;

    const msgEl = document.getElementById('result-message');
    
    // Lógica del modo Automático
    if (mode === 'auto' && totalScore >= 80) {
        nLevel++;
        msgEl.innerText = `¡Excelente! Subes al nivel N=${nLevel}`;
        msgEl.style.color = 'var(--accent)';
    } else if (mode === 'auto' && totalScore < 50 && nLevel > 1) {
        nLevel--;
        msgEl.innerText = `Demasiado difícil. Bajamos a N=${nLevel} para reforzar.`;
        msgEl.style.color = 'var(--text-sec)';
    } else {
        msgEl.innerText = totalScore >= 80 ? '¡Muy buen entrenamiento!' : 'Sigue practicando. La memoria de trabajo es como un músculo.';
        msgEl.style.color = 'var(--text-main)';
    }
}