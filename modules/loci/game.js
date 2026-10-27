// Base de datos del Palacio de la Memoria basada en tus notas sobre la RND
const lociData = {
    'locus-bed': {
        title: '🛏️ Reposo y la RND',
        desc: 'Un circuito de áreas cerebrales hiperconectadas que se encienden con su máxima intensidad exactamente cuando NO estás realizando ninguna tarea que requiera esfuerzo cognitivo externo.'
    },
    'locus-window': {
        title: '🪟 La Mente que Divaga',
        desc: 'Mientras miras por la ventana, esta red está consumiendo una inmensa cantidad de energía metabólica para organizar tu mundo interior y proyectar escenarios futuros.'
    },
    'locus-bookshelf': {
        title: '📚 Archivo Autobiográfico',
        desc: 'La RND se encarga de consolidar tu memoria autobiográfica, construir tu sentido de identidad personal y evaluar interacciones sociales pasadas.'
    },
    'locus-desk': {
        title: '💻 Atención Ejecutiva (El Balancín)',
        desc: 'Es la red que usas para concentrarte. Funciona como un balancín con la RND: cuando te concentras en el exterior, la RND debe apagarse.'
    },
    'locus-door': {
        title: '🚪 Conflicto y Fatiga',
        desc: 'Si no logras suprimir la RND al concentrarte, el cerebro compite por procesar estímulos. El resultado: experimentas fatiga cognitiva, falta de foco o rumiación ansiosa.'
    }
};

const visitedLoci = new Set();
const titleEl = document.getElementById('info-title');
const descEl = document.getElementById('info-desc');
const counterEl = document.getElementById('visited-counter');
const btnComplete = document.getElementById('btn-complete');

// Configuración de los botones (Loci)
document.querySelectorAll('.locus').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const id = e.currentTarget.id;
        const data = lociData[id];
        
        // Mostrar información
        titleEl.innerText = data.title;
        descEl.innerText = data.desc;
        
        // Marcar como visitado visualmente y en lógica
        e.currentTarget.classList.add('visited');
        visitedLoci.add(id);
        
        // Actualizar contador
        counterEl.innerText = `${visitedLoci.size}/5 Loci`;
        
        // Si visitó todos, mostrar botón de completar
        if (visitedLoci.size === 5) {
            btnComplete.style.display = 'block';
        }
    });
});

document.getElementById('btn-close').onclick = () => window.location.href = '../../index.html';

document.getElementById('btn-complete').onclick = () => {
    // Guardar sesión para el Hub (Anillo de Actividad)
    const today = new Date().toDateString();
    let activity = JSON.parse(localStorage.getItem('brainActivity')) || {};
    if (activity.date !== today) activity = { date: today, sessions: 0 };
    
    activity.sessions += 1;
    localStorage.setItem('brainActivity', JSON.stringify(activity));
    
    window.location.href = '../../index.html';
};