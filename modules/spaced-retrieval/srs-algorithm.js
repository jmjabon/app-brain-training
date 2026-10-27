// MAZO POR DEFECTO (Se carga si localStorage está vacío)
const defaultDeck = [
    { id: 1, q: "¿Qué es la Red Neuronal por Defecto (RND)?", a: "Un circuito cerebral que se enciende con máxima intensidad cuando NO realizas tareas de esfuerzo cognitivo externo.", interval: 0, ease: 2.5, nextReview: 0 },
    { id: 2, q: "¿De qué se encarga la RND?", a: "De consolidar la memoria autobiográfica, construir la identidad personal y proyectar escenarios futuros.", interval: 0, ease: 2.5, nextReview: 0 },
    { id: 3, q: "¿Qué ocurre si no logras apagar la RND al concentrarte?", a: "Experimentas fatiga cognitiva y falta de foco, ya que el cerebro compite por procesar estímulos externos y pensamientos internos simultáneamente.", interval: 0, ease: 2.5, nextReview: 0 },
    { id: 4, q: "¿En qué consiste 'El filtro de los 8 años' de la Técnica Feynman?", a: "En explicar un concepto complejo como si hablaras con un niño de 8 años, para detectar lagunas de conocimiento si te atascas o usas jerga.", interval: 0, ease: 2.5, nextReview: 0 }
];

let deck = [];
let dueCards = [];
let currentCard = null;

// Referencias DOM
const elFlashcard = document.getElementById('flashcard');
const elFlashcardContainer = document.getElementById('flashcard-container');
const elCardQ = document.getElementById('card-q');
const elCardA = document.getElementById('card-a');
const btnShowAnswer = document.getElementById('btn-show-answer');
const evalButtons = document.getElementById('eval-buttons');
const counter = document.getElementById('cards-counter');
const doneMsg = document.getElementById('done-message');

document.getElementById('btn-close').onclick = () => window.location.href = '../../index.html';

// 1. INICIALIZAR
function init() {
    // Cargar mazo guardado o el de defecto
    const savedDeck = localStorage.getItem('brainDeck');
    deck = savedDeck ? JSON.parse(savedDeck) : defaultDeck;

    // Filtrar tarjetas cuyo momento de repaso haya llegado
    const now = Date.now();
    dueCards = deck.filter(card => card.nextReview <= now);
    
    // Barajar aleatoriamente las tarjetas que tocan hoy
    dueCards.sort(() => Math.random() - 0.5);

    renderNextCard();
}

// 2. MOSTRAR TARJETA
function renderNextCard() {
    if (dueCards.length === 0) {
        finishStudySession();
        return;
    }

    currentCard = dueCards[0]; // Tomamos la primera de la cola
    counter.innerText = `Tarjetas: ${dueCards.length}`;
    
    // Reseteamos interfaz
    elFlashcard.classList.remove('is-flipped');
    elCardQ.innerText = currentCard.q;
    elCardA.innerText = currentCard.a;
    
    btnShowAnswer.style.display = 'block';
    evalButtons.style.display = 'none';
}

// 3. GIRAR TARJETA
btnShowAnswer.addEventListener('click', () => {
    elFlashcard.classList.add('is-flipped');
    btnShowAnswer.style.display = 'none';
    
    // Pequeño delay para que la tarjeta termine de girar antes de mostrar botones
    setTimeout(() => { evalButtons.style.display = 'flex'; }, 300);
});

// 4. ALGORITMO SRS (Basado en SuperMemo-2)
document.querySelectorAll('.eval-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const difficulty = e.currentTarget.dataset.ease;
        processCard(difficulty);
    });
});

function processCard(difficulty) {
    const cardIndex = deck.findIndex(c => c.id === currentCard.id);
    let card = deck[cardIndex];

    const DAY_IN_MS = 24 * 60 * 60 * 1000;

    if (difficulty === 'hard') {
        card.interval = 0;
        card.ease = Math.max(1.3, card.ease - 0.2);
        card.nextReview = Date.now(); // Toca repetirla HOY
        dueCards.push(dueCards.shift()); // La pasamos al final de la cola de hoy
    } else {
        if (difficulty === 'good') {
            card.interval = card.interval === 0 ? 1 : card.interval * 2;
        } else if (difficulty === 'easy') {
            card.interval = card.interval === 0 ? 4 : Math.round(card.interval * card.ease);
            card.ease += 0.15;
        }
        card.nextReview = Date.now() + (card.interval * DAY_IN_MS);
        dueCards.shift(); // La sacamos de la cola de hoy
    }

    deck[cardIndex] = card;
    localStorage.setItem('brainDeck', JSON.stringify(deck));

    renderNextCard();
}

// 5. FIN DE SESIÓN
function finishStudySession() {
    elFlashcardContainer.style.display = 'none';
    document.querySelector('.controls-area').style.display = 'none';
    counter.innerText = '0';
    doneMsg.style.display = 'flex';

    // Sumar 1 sesión al anillo del Menú Principal
    const today = new Date().toDateString();
    let activity = JSON.parse(localStorage.getItem('brainActivity')) || {};
    if (activity.date !== today) activity = { date: today, sessions: 0 };
    activity.sessions += 1;
    localStorage.setItem('brainActivity', JSON.stringify(activity));
}

// Arrancar motor
init();