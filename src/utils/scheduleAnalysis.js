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
 * @param {Array} subjectsConfig - Liste des matières depuis config_ue.json
 * @param {string} semester - "S1", "S2" ou "all"
 * @returns {Object} Heures par matière
 */
export const calculateHoursBySubject = (events, subjectsConfig, semester = 'all') => {
    const now = new Date();
    const hoursBySubject = {};
    const { start: yearStart, end: yearEnd } = getAcademicYearDates();

    // 1. Initialiser toutes les Matières configurées
    subjectsConfig.forEach(subjectConf => {
        hoursBySubject[subjectConf.id] = {
            id: subjectConf.id,
            nom: subjectConf.nom,
            category: subjectConf.category, // Nom de l'UE
            hoursCompleted: 0,
            hoursRemaining: 0,
            totalHours: 0,
            events: []
        };
    });

    // Liste des catégories (UEs) uniques pour le fallback
    const uniqueCategories = [...new Set(subjectsConfig.map(s => s.category))];

    // 2. Parcourir les événements
    events.forEach(event => {
        const eventStart = new Date(event.start);

        // Ignorer les événements hors de l'année scolaire
        if (eventStart < yearStart || eventStart > yearEnd) return;

        const eventSemester = getSemester(eventStart);

        // Filtrer par semestre si spécifié
        if (semester !== 'all' && eventSemester !== semester) return;

        // Calculer la durée en heures
        const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);

        // A. Essayer de trouver la matière correspondante
        let matchedSubject = findMatchingSubject(event.title, subjectsConfig);
        let subjectId = matchedSubject ? matchedSubject.id : null;

        // B. Si pas de correspondance matière, on gère le cas "Non Classé"
        if (!matchedSubject) {
            // Nettoyer le titre pour créer un ID stable
            const cleanTitle = event.title.replace(/^(TD|TP|CM|Cours)\s+/i, '').trim();
            const dynamicId = `dynamic_${cleanTitle.toLowerCase().replace(/\s+/g, '_')}`;

            // Si le sujet dynamique n'existe pas encore, on le crée
            if (!hoursBySubject[dynamicId]) {
                // Tentative de deviner l'UE via le titre de l'événement
                const guessedCategory = findMatchingCategory(event.title, uniqueCategories) || "AUTRES / NON CLASSÉ";

                hoursBySubject[dynamicId] = {
                    id: dynamicId,
                    nom: cleanTitle || "Autre",
                    category: guessedCategory,
                    hoursCompleted: 0,
                    hoursRemaining: 0,
                    totalHours: 0,
                    events: [],
                    isDynamic: true
                };
            }
            subjectId = dynamicId;
        }

        // C. Ajouter les heures
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
 * Mots vides à ignorer lors du matching pour éviter les faux positifs
 */
const STOP_WORDS = ['cours', 'td', 'tp', 'cm', 'projet', 'introduction', 'fondamentaux', 'bases', 'technique', 'conf', 'conference', 'semaine', 'groupe'];

/**
 * Trouve la matière correspondante à un titre d'événement avec un système de scoring amélioré et alias
 */
const findMatchingSubject = (title, subjectsConfig) => {
    if (!title) return null;

    const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2);

    let bestMatch = null;
    let maxScore = 0;

    for (const subjectConf of subjectsConfig) {
        // 0. Vérification des Alias (Priorité absolue)
        if (subjectConf.aliases && subjectConf.aliases.length > 0) {
            for (const alias of subjectConf.aliases) {
                const normalizedAlias = alias.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                // Correspondance exacte de l'alias dans le titre ?
                if (normalizedTitle.includes(normalizedAlias)) {
                    return subjectConf;
                }
            }
        }

        const normalizedSubjectName = subjectConf.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // 1. Correspondance exacte
        if (normalizedTitle === normalizedSubjectName) return subjectConf;

        // 2. Inclusion directe (forte)
        if (normalizedTitle.includes(normalizedSubjectName)) return subjectConf;

        // 3. Scoring par mots-clés
        const subjectWords = normalizedSubjectName.split(/\s+/).filter(w => w.length > 2);

        // Filtrer les stop words pour le sujet
        const significantSubjectWords = subjectWords.filter(w => !STOP_WORDS.includes(w));
        const wordsToMatch = significantSubjectWords.length > 0 ? significantSubjectWords : subjectWords;

        let matchCount = 0;
        wordsToMatch.forEach(word => {
            if (titleWords.some(t => t.includes(word))) {
                matchCount++;
            }
        });

        if (wordsToMatch.length === 0) continue;

        const score = matchCount / wordsToMatch.length; // Pourcentage de mots du sujet trouvés

        // Critères d'acceptation
        if (score > maxScore) {
            maxScore = score;
            bestMatch = subjectConf;
        }
    }

    // Seuil de validation : au moins 50% des mots significatifs trouvés
    if (bestMatch && maxScore >= 0.5) {
        return bestMatch;
    }

    return null;
};

/**
 * Tente de trouver une catégorie (UE) correspondante dans le titre
 */
const findMatchingCategory = (title, categories) => {
    if (!title) return null;
    const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const category of categories) {
        if (!category) continue;

        // Enlever le préfixe "UE " pour la recherche
        const cleanCategory = category.replace(/^UE\s+/, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Si le titre contient le nom de l'UE (ex: "Management")
        if (normalizedTitle.includes(cleanCategory)) {
            return category;
        }

        // Mots clés de la catégorie
        const catWords = cleanCategory.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.includes(w));
        const matchCount = catWords.filter(w => normalizedTitle.includes(w)).length;

        if (catWords.length > 0 && matchCount >= catWords.length * 0.75) {
            return category;
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
