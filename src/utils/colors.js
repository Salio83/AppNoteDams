/**
 * Couleurs pour les catégories d'UE et les événements du calendrier
 */

// Palette de couleurs par catégorie d'UE
export const CATEGORY_COLORS = {
    'UE ENTREPRISE ET CULTURE PROFESSIONNELLE': {
        bg: 'bg-blue-100',
        border: 'border-blue-300',
        text: 'text-blue-800',
        gradient: 'from-blue-100 to-blue-200',
        hex: '#3B82F6'
    },
    'UE INTRODUCTION A LA PROGRAMMATION SYSTEME': {
        bg: 'bg-emerald-100',
        border: 'border-emerald-300',
        text: 'text-emerald-800',
        gradient: 'from-emerald-100 to-emerald-200',
        hex: '#10B981'
    },
    'UE FONDEMENTS MATHEMATIQUES DE LA SCIENCE DES DONNEES': {
        bg: 'bg-purple-100',
        border: 'border-purple-300',
        text: 'text-purple-800',
        gradient: 'from-purple-100 to-purple-200',
        hex: '#8B5CF6'
    },
    'UE MODELISATION ALGORITHMIQUE ET SYSTEMES D\'INFORMATION': {
        bg: 'bg-amber-100',
        border: 'border-amber-300',
        text: 'text-amber-800',
        gradient: 'from-amber-100 to-amber-200',
        hex: '#F59E0B'
    }
};

// Couleurs par défaut pour les événements non reconnus
const DEFAULT_COLORS = [
    { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', hex: '#F43F5E' },
    { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', hex: '#06B6D4' },
    { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', hex: '#F97316' },
    { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', hex: '#14B8A6' },
    { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', hex: '#EC4899' },
    { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800', hex: '#6366F1' },
];

// Cache pour les couleurs assignées aux titres d'événements
const eventColorCache = new Map();

/**
 * Obtient la couleur pour une UE basée sur sa catégorie
 */
export const getUEColor = (category) => {
    return CATEGORY_COLORS[category] || DEFAULT_COLORS[0];
};

/**
 * Obtient une couleur cohérente pour un événement du calendrier
 * Les événements avec le même titre auront toujours la même couleur
 */
export const getEventColor = (eventTitle) => {
    if (!eventTitle) return DEFAULT_COLORS[0];

    // Normaliser le titre pour regrouper les événements similaires
    const normalizedTitle = normalizeEventTitle(eventTitle);

    // Vérifier le cache
    if (eventColorCache.has(normalizedTitle)) {
        return eventColorCache.get(normalizedTitle);
    }

    // Essayer de matcher une catégorie d'UE
    for (const [category, colors] of Object.entries(CATEGORY_COLORS)) {
        const keywords = getCategoryKeywords(category);
        if (keywords.some(kw => normalizedTitle.includes(kw))) {
            eventColorCache.set(normalizedTitle, colors);
            return colors;
        }
    }

    // Générer une couleur basée sur le hash du titre
    const hash = hashString(normalizedTitle);
    const colorIndex = Math.abs(hash) % DEFAULT_COLORS.length;
    const color = DEFAULT_COLORS[colorIndex];

    eventColorCache.set(normalizedTitle, color);
    return color;
};

/**
 * Normalise un titre d'événement pour le regroupement
 */
const normalizeEventTitle = (title) => {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Extrait les mots-clés d'une catégorie
 */
const getCategoryKeywords = (category) => {
    const keywordMap = {
        'UE ENTREPRISE ET CULTURE PROFESSIONNELLE': ['anglais', 'english', 'comptabilite', 'gestion', 'economie', 'culture'],
        'UE INTRODUCTION A LA PROGRAMMATION SYSTEME': ['shell', 'systeme', 'c ', 'programmation c', 'linux', 'unix'],
        'UE FONDEMENTS MATHEMATIQUES DE LA SCIENCE DES DONNEES': ['math', 'statistique', 'optimisation', 'ia', 'donnees', 'r '],
        'UE MODELISATION ALGORITHMIQUE ET SYSTEMES D\'INFORMATION': ['algo', 'git', 'base de donnees', 'sql', 'uml', 'systemes d\'information']
    };
    return keywordMap[category] || [];
};

/**
 * Hash simple pour une chaîne
 */
const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
};

/**
 * Courtes abbréviations pour les catégories
 */
export const CATEGORY_SHORT_NAMES = {
    'UE ENTREPRISE ET CULTURE PROFESSIONNELLE': 'Culture Pro',
    'UE INTRODUCTION A LA PROGRAMMATION SYSTEME': 'Prog Système',
    'UE FONDEMENTS MATHEMATIQUES DE LA SCIENCE DES DONNEES': 'Maths & Data',
    'UE MODELISATION ALGORITHMIQUE ET SYSTEMES D\'INFORMATION': 'Algo & SI'
};

export const getCategoryShortName = (category) => {
    return CATEGORY_SHORT_NAMES[category] || category;
};
