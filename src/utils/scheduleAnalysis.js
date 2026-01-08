// Date de début du Semestre 2 (28 janvier)
// Note: On définit dynamiquement l'année pour gérer le changement d'année scolaire
const getAcademicYearDates = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11

    // Si on est entre Janvier (0) et Juillet (6), le début d'année était Septembre l'an dernier
    // Si on est entre Septembre (8) et Décembre (11), le début est Septembre cette année
    const startYear = currentMonth < 7 ? now.getFullYear() - 1 : now.getFullYear();

    return {
        start: new Date(startYear, 8, 1), // 1er Septembre
        end: new Date(startYear + 1, 6, 31), // 31 Juillet
        s2Start: new Date(startYear + 1, 0, 28) // 28 Janvier
    };
};

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

    // Patterns pour détecter un examen (mots-clés clairs uniquement)
    const examPatterns = [
        /\bexam\b/i,          // "exam" comme mot complet (Optim science données Exam)
        /examen/i,            // examen, Examen, EXAMEN
        /\bds\b/i,            // "ds" comme mot complet
        /\bds\d/i,            // ds1, ds2, etc
        /ds\s+\w/i,           // "ds " suivi de texte
        /épreuve/i,
        /epreuve/i,           // sans accent
        /partiel/i,
        /soutenance/i
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
    const { s2Start } = getAcademicYearDates();
    return date < s2Start ? 'S1' : 'S2';
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
    const { start: yearStart, end: yearEnd } = getAcademicYearDates();

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

    // Parcourir les événements
    events.forEach(event => {
        const eventStart = new Date(event.start);

        // Ignorer les événements hors de l'année scolaire
        if (eventStart < yearStart || eventStart > yearEnd) return;

        const eventSemester = getSemester(eventStart);

        // Filtrer par semestre si spécifié
        if (semester !== 'all' && eventSemester !== semester) return;

        // Calculer la durée en heures
        const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);

        // Essayer de trouver l'UE correspondante
        let matchedUE = findMatchingUE(event.title, ues);
        let subjectId = matchedUE ? matchedUE.id : null;

        // Si pas de correspondance, on crée une "Matière détectée" dynamique
        if (!matchedUE) {
            // Nettoyer le titre pour grouper les événements similaires (ex: "TD Anglais" et "Anglais")
            const cleanTitle = event.title.replace(/^(TD|TP|CM|Cours)\s+/i, '').trim();
            const dynamicId = `dynamic_${cleanTitle.toLowerCase().replace(/\s+/g, '_')}`;

            if (!hoursBySubject[dynamicId]) {
                hoursBySubject[dynamicId] = {
                    id: dynamicId,
                    nom: cleanTitle || "Autre",
                    category: "AUTRES / NON CLASSÉ", // Catégorie par défaut pour les non-reconnus
                    hoursCompleted: 0,
                    hoursRemaining: 0,
                    totalHours: 0,
                    events: [],
                    isDynamic: true
                };
            }
            subjectId = dynamicId;
        }

        if (subjectId) {
            const subject = hoursBySubject[subjectId];
            subject.totalHours += duration;

            if (eventStart < now) {
                subject.hoursCompleted += duration;
            } else {
                subject.hoursRemaining += duration;
            }

            subject.events.push({
                ...event,
                duration,
                isCompleted: eventStart < now
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

        // 1. Correspondance exacte ou partielle directe
        if (normalizedTitle.includes(normalizedUE) || normalizedUE.includes(normalizedTitle)) {
            return ue;
        }

        // 2. Correspondance par mots-clés
        const ueWords = normalizedUE.split(/\s+/).filter(w => w.length > 2); // Mots significatifs > 2 lettres
        const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2);

        // Compter combien de mots de l'UE sont présents dans le titre
        const matchCount = ueWords.filter(word => titleWords.some(t => t.includes(word))).length;

        // Critères assouplis :
        // - Si l'UE a peu de mots (1-2), il faut qu'au moins 1 mot majeur corresponde (ex: "Anglais" dans "Langue Anglais")
        // - Si l'UE a beaucoup de mots, il en faut au moins 2
        if (ueWords.length <= 2 && matchCount >= 1) return ue;
        if (ueWords.length > 2 && matchCount >= 2) return ue;
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
