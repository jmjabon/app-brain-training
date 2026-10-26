// Constantes y Estado
let totalTurns = 12;
const TURN_DURATION = 2500; // 2.5 segundos por turno
const STIMULUS_DURATION = 800; // El cuadrado brilla por 800ms
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'l']; // Letras claras en español

let nLevel = 1;
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
    
    // 1. Generamos una secuencia completamente aleatoria primero
    for (let i = 0; i < totalTurns; i++) {
        let pos = Math.floor(Math.random() * 9);
        let audio = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        sequence.push({ pos, audio });
    }

    // 2. Calculamos cuántas coincidencias EXACTAS queremos (30% de los turnos jugables)
    const possibleMatches = totalTurns - nLevel;
    if (possibleMatches <= 0) return; // Evita errores si seleccionas un N mayor que los turnos
    
    // Garantizamos matemáticamente al menos 1 coincidencia o el 30% del total
    const targetMatches = Math.max(1, Math.round(possibleMatches * 0.3)); 

    // 3. Función para elegir turnos al azar donde inyectaremos los aciertos
    const getMatchIndices = () => {
        let indices = [];
        for (let i = nLevel; i < totalTurns; i++) indices.push(i);
        // Barajamos los turnos posibles y nos quedamos con la cantidad exacta que necesitamos
        return indices.sort(() => Math.random() - 0.5).slice(0, targetMatches);
    };

    // 4. Inyectamos los aciertos forzados sobreescribiendo el azar inicial
    const posIndices = getMatchIndices();
    const audioIndices = getMatchIndices();

    posIndices.forEach(i => sequence[i].pos = sequence[i - nLevel].pos);
    audioIndices.forEach(i => sequence[i].audio = sequence[i - nLevel].audio);
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
    synth.cancel();
    screens.game.classList.remove('active');
    screens.result.classList.add('active');

    let posHits = 0, posMisses = 0, posFalseAlarms = 0;
    let audioHits = 0, audioMisses = 0, audioFalseAlarms = 0;
    
    let logHTML = '<strong>Análisis de Turnos (N='+nLevel+')</strong><br><br>';

    // Empezamos a evaluar desde el turno N (los primeros turnos no se pueden comparar)
    for (let i = nLevel; i < totalTurns; i++) {
        const isPosMatch = sequence[i].pos === sequence[i - nLevel].pos;
        const isAudioMatch = sequence[i].audio === sequence[i - nLevel].audio;

        const pressedPos = userResponses.pos[i];
        const pressedAudio = userResponses.audio[i];

        // Lógica POSICIÓN
        let posResult = '⚪ Correcto (Nada)';
        if (isPosMatch && pressedPos) { posHits++; posResult = '✅ ACIERTO'; }
        else if (isPosMatch && !pressedPos) { posMisses++; posResult = '❌ OMISIÓN'; }
        else if (!isPosMatch && pressedPos) { posFalseAlarms++; posResult = '⚠️ FALSA ALARMA'; }

        // Lógica AUDIO
        let audioResult = '⚪ Correcto (Nada)';
        if (isAudioMatch && pressedAudio) { audioHits++; audioResult = '✅ ACIERTO'; }
        else if (isAudioMatch && !pressedAudio) { audioMisses++; audioResult = '❌ OMISIÓN'; }
        else if (!isAudioMatch && pressedAudio) { audioFalseAlarms++; audioResult = '⚠️ FALSA ALARMA'; }

        // Imprimir en el Log
        logHTML += `<div style="border-bottom: 1px solid #ccc; padding: 8px 0;">`;
        logHTML += `<strong style="color: var(--accent);">Turno ${i+1}</strong> 
                    (Pos: ${sequence[i].pos}, Letra: ${sequence[i].audio})<br>`;
        logHTML += `📍 Posición: ${posResult}<br>`;
        logHTML += `🔊 Audio: ${audioResult}`;
        logHTML += `</div>`;
    }

    document.getElementById('sequence-log').innerHTML = logHTML;

    // Mostrar el resumen de fallos y aciertos en la cabecera
    document.getElementById('score-pos').innerHTML = 
        `<span style="color: green;">${posHits}</span> | <span style="color: red;">${posMisses}</span> | <span style="color: orange;">${posFalseAlarms}</span>`;
    document.getElementById('score-audio').innerHTML = 
        `<span style="color: green;">${audioHits}</span> | <span style="color: red;">${audioMisses}</span> | <span style="color: orange;">${audioFalseAlarms}</span>`;
    
    // Para el modo automático, calculamos la precisión total (penalizando falsas alarmas)
    const totalTargets = posHits + posMisses + audioHits + audioMisses;
    const totalCorrect = posHits + audioHits;
    const totalMistakes = posMisses + audioMisses + posFalseAlarms + audioFalseAlarms;
    
    // Fórmula de precisión que usamos en pruebas neuropsicológicas:
    let totalScore = totalTargets > 0 ? Math.max(0, Math.round(((totalCorrect - (posFalseAlarms + audioFalseAlarms)) / totalTargets) * 100)) : 100;

    const msgEl = document.getElementById('result-message');
    
    if (mode === 'auto') {
        if (totalScore >= 80) {
            nLevel = Math.min(nLevel + 1, 9);
            msgEl.innerText = `Precisión: ${totalScore}%. ¡Subes a N=${nLevel}!`;
            msgEl.style.color = 'var(--accent)';
        } else if (totalScore < 50 && nLevel > 1) {
            nLevel--;
            msgEl.innerText = `Precisión: ${totalScore}%. Bajamos a N=${nLevel}.`;
            msgEl.style.color = 'var(--text-sec)';
        } else {
            msgEl.innerText = `Precisión: ${totalScore}%. Te mantienes en N=${nLevel}.`;
            msgEl.style.color = 'var(--text-main)';
        }
        updateNUI();
    } else {
        msgEl.innerText = `Precisión global: ${totalScore}%`;
        msgEl.style.color = 'var(--text-main)';
    }
}