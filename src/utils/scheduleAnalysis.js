/**
 * Schedule Analysis Utilities
 * Détection d'examens et calcul des heures restantes
 */

// Date de fin du S1 (22 janvier 2026)
const S1_END_DATE = new Date('2026-01-22T23:59:59');

/**
 * Détermine si un événement est un examen
 * Détecte : "examen", "ds", "amphi" dans le titre, lieu ou description
 */
export const isExamEvent = (event) => {
    const text = [
        event.title || '',
        event.location || '',
        event.description || ''
    ].join(' ').toLowerCase();

    // Patterns pour détecter un examen
    const examPatterns = [
        /examen/i,
        /\bds\b/i,           // "ds" comme mot complet
        /\bds\s/i,           // "ds " suivi d'espace
        /^ds/i,              // commence par "ds"
        /amphi/i,
        /controle/i,
        /épreuve/i,
        /partiel/i
    ];

    return examPatterns.some(pattern => pattern.test(text));
};

/**
 * Détecte tous les examens à partir des événements
 * @param {Array} events - Liste des événements du calendrier
 * @returns {Array} Liste des examens triés par date
 */
export const detectExams = (events) => {
    const now = new Date();

    return events
        .filter(event => isExamEvent(event))
        .filter(event => new Date(event.start) >= now) // Seulement les futurs
        .map(event => ({
            ...event,
            daysUntil: Math.ceil((new Date(event.start) - now) / (1000 * 60 * 60 * 24)),
            semester: getSemester(new Date(event.start))
        }))
        .sort((a, b) => new Date(a.start) - new Date(b.start));
};

/**
 * Détermine le semestre d'une date
 * @param {Date} date
 * @returns {string} "S1" ou "S2"
 */
export const getSemester = (date) => {
    return date <= S1_END_DATE ? 'S1' : 'S2';
};

/**
 * Calcule les heures par matière à partir des événements
 * @param {Array} events - Liste des événements
 * @param {Array} ues - Liste des UEs depuis config_ue.json
 * @param {string} semester - "S1", "S2" ou "all"
 * @returns {Object} Heures par matière
 */
export const calculateHoursBySubject = (events, ues, semester = 'all') => {
    const now = new Date();
    const hoursBySubject = {};

    // Initialiser toutes les UEs
    ues.forEach(ue => {
        hoursBySubject[ue.id] = {
            id: ue.id,
            nom: ue.nom,
            category: ue.category,
            hoursCompleted: 0,
            hoursRemaining: 0,
            totalHours: 0,
            events: []
        };
    });

    // Parcourir les événements et les associer aux UEs
    events.forEach(event => {
        const eventDate = new Date(event.start);
        const eventSemester = getSemester(eventDate);

        // Filtrer par semestre si spécifié
        if (semester !== 'all' && eventSemester !== semester) return;

        // Calculer la durée en heures
        const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);

        // Essayer de trouver l'UE correspondante
        const matchedUE = findMatchingUE(event.title, ues);

        if (matchedUE) {
            const subject = hoursBySubject[matchedUE.id];
            subject.totalHours += duration;

            if (eventDate < now) {
                subject.hoursCompleted += duration;
            } else {
                subject.hoursRemaining += duration;
            }

            subject.events.push({
                ...event,
                duration,
                isCompleted: eventDate < now
            });
        }
    });

    return Object.values(hoursBySubject).filter(s => s.totalHours > 0);
};

/**
 * Trouve l'UE correspondante à un titre d'événement
 * @param {string} title - Titre de l'événement
 * @param {Array} ues - Liste des UEs
 * @returns {Object|null} UE trouvée ou null
 */
const findMatchingUE = (title, ues) => {
    if (!title) return null;

    const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Chercher une correspondance dans les noms d'UE
    for (const ue of ues) {
        const normalizedUE = ue.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Vérifier si le titre contient des mots-clés de l'UE
        const ueWords = normalizedUE.split(/\s+/).filter(w => w.length > 3);
        const matchCount = ueWords.filter(word => normalizedTitle.includes(word)).length;

        if (matchCount >= 2 || (ueWords.length === 1 && matchCount === 1)) {
            return ue;
        }

        // Correspondance directe partielle
        if (normalizedTitle.includes(normalizedUE) || normalizedUE.includes(normalizedTitle)) {
            return ue;
        }
    }

    return null;
};

/**
 * Récupère les statistiques résumées
 */
export const getScheduleStats = (events) => {
    const now = new Date();
    const upcomingExams = detectExams(events);

    return {
        totalEvents: events.length,
        upcomingExamsCount: upcomingExams.length,
        nextExam: upcomingExams[0] || null,
        s1Events: events.filter(e => getSemester(new Date(e.start)) === 'S1').length,
        s2Events: events.filter(e => getSemester(new Date(e.start)) === 'S2').length
    };
};
