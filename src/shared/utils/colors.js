/**
 * Couleurs pour les catégories d'UE et les événements du calendrier.
 * Direction "Calme" : chaque matière/catégorie est rattachée à l'une des
 * 4 familles de teintes t1..t4 définies dans src/index.css (var(--tN-bg/ink)).
 */

const FAMILIES = ['t1', 't2', 't3', 't4'];

const colorCache = new Map();

const normalize = (str) => (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

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
 * Retourne le style (famille + variables CSS) associé de façon stable à une clé
 * (titre d'événement ou catégorie d'UE).
 */
const familyStyleFor = (key) => {
    const normalized = normalize(key);
    if (colorCache.has(normalized)) return colorCache.get(normalized);

    const family = FAMILIES[Math.abs(hashString(normalized)) % FAMILIES.length];
    const style = {
        family,
        bg: `var(--${family}-bg)`,
        ink: `var(--${family}-ink)`,
    };

    colorCache.set(normalized, style);
    return style;
};

/**
 * Obtient la couleur pour une UE basée sur sa catégorie
 */
export const getUEColor = (category) => familyStyleFor(category || '');

/**
 * Obtient une couleur cohérente pour un événement du calendrier.
 * Les événements avec le même titre auront toujours la même couleur.
 */
export const getEventColor = (eventTitle) => familyStyleFor(eventTitle || '');

/**
 * Transforme un nom de catégorie d'UE (souvent en MAJUSCULES dans la maquette)
 * en un intitulé lisible, sans dépendre d'une liste figée de filières.
 */
const SMALL_WORDS = new Set(['et', 'de', 'des', 'du', 'la', 'le', 'les', 'l', 'à', 'en', 'aux', 'd']);

export const getCategoryShortName = (category) => {
    if (!category) return '';
    const withoutPrefix = category.replace(/^UE\s+/i, '');
    return withoutPrefix
        .toLowerCase()
        .split(/(\s|[''])/)
        .map(part => {
            if (/^\s$/.test(part) || part === '' || part === "'" || part === "'") return part;
            return SMALL_WORDS.has(part) ? part : part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join('')
        .replace(/^./, c => c.toUpperCase());
};
