// Constantes y Estado
let totalTurns = 12;
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

document.getElementById('btn-close-game').onclick = () => {
    clearTimeout(gameInterval); // Detiene el temporizador de las luces
    synth.cancel(); // Silencia la voz inmediatamente por si estaba hablando
    screens.game.classList.remove('active');
    screens.setup.classList.add('active'); // Vuelve al menú
};

document.getElementById('btn-inc-turns').onclick = () => { totalTurns = Math.min(totalTurns + 6, 48); updateTurnsUI(); };
document.getElementById('btn-dec-turns').onclick = () => { totalTurns = Math.max(totalTurns - 6, 6); updateTurnsUI(); };

function updateTurnsUI() { document.getElementById('turns-value').innerText = totalTurns; }

// --- LÓGICA DEL JUEGO ---
function generateSequence() {
    sequence = [];
    for (let i = 0; i < totalTurns; i++) {
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
    userResponses = { pos: new Array(totalTurns).fill(false), audio: new Array(totalTurns).fill(false) };
    
    document.getElementById('game-n-indicator').innerText = `N = ${nLevel}`;
    
    screens.setup.classList.remove('active');
    screens.game.classList.add('active');
    
    // Pequeña pausa antes de empezar
    setTimeout(playTurn, 1000); 
}

function playTurn() {
    if (currentTurn >= totalTurns) {
        endGame();
        return;
    }

    document.getElementById('game-turn-indicator').innerText = `Turno ${currentTurn + 1} / ${totalTurns}`;
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
function registerPos(e) {
    if(e && e.cancelable) e.preventDefault();
    if (currentTurn > 0) userResponses.pos[currentTurn - 1] = true;
    console.log(`[JUEGO] Pulsado POSICIÓN en turno ${currentTurn}`);
}

function registerAudio(e) {
    if(e && e.cancelable) e.preventDefault();
    if (currentTurn > 0) userResponses.audio[currentTurn - 1] = true;
    console.log(`[JUEGO] Pulsado AUDIO en turno ${currentTurn}`);
}

const btnPos = document.getElementById('btn-pos');
const btnAudio = document.getElementById('btn-audio');

// Soporte táctil para pantallas iOS
btnPos.addEventListener('touchstart', registerPos, {passive: false});
btnAudio.addEventListener('touchstart', registerAudio, {passive: false});

// Soporte para clics de ratón en ordenadores
btnPos.addEventListener('mousedown', registerPos);
btnAudio.addEventListener('mousedown', registerAudio);


// --- RESULTADOS ---
function endGame() {
    clearTimeout(gameInterval);
    screens.game.classList.remove('active');
    screens.result.classList.add('active');

    let posCorrect = 0, posPossible = 0;
    let audioCorrect = 0, audioPossible = 0;

    for (let i = nLevel; i < totalTurns; i++) {
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
    

    // Lógica de Modos (Manual vs Automático)
    if (mode === 'auto') {
        if (totalScore >= 80) {
            nLevel = Math.min(nLevel + 1, 9); // Sube nivel (máximo 9)
            msgEl.innerText = `¡Excelente! Subes al nivel N=${nLevel}`;
            msgEl.style.color = 'var(--accent)';
        } else if (totalScore < 50 && nLevel > 1) {
            nLevel--; // Baja nivel
            msgEl.innerText = `Demasiado difícil. Bajamos a N=${nLevel} para reforzar.`;
            msgEl.style.color = 'var(--text-sec)';
        } else {
            msgEl.innerText = `Te mantienes en N=${nLevel}. Buen esfuerzo.`;
            msgEl.style.color = 'var(--text-main)';
        }
        updateNUI(); // ¡ESTA LÍNEA ES LA CLAVE! Actualiza el número en el menú
    } else {
        // En modo manual, el texto es genérico y el nivel no cambia
        msgEl.innerText = totalScore >= 80 ? '¡Muy buen entrenamiento!' : 'Sigue practicando. La memoria de trabajo es como un músculo.';
        msgEl.style.color = 'var(--text-main)';
    }
}