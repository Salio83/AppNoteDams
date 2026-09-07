import React from 'react';

/**
 * Petit bouton compact utilisé pour les filtres, bascules de vue et
 * contrôles de navigation (semaine précédente/suivante, semestre, etc.).
 * Toujours un vrai bouton (fond + forme), jamais du texte simple cliquable.
 */
const PillButton = ({ active, onClick, children, title }) => (
    <button
        onClick={onClick}
        title={title}
        className="px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors"
        style={active
            ? { background: 'var(--accent-solid)', color: 'var(--bg)', fontWeight: 600 }
            : { background: 'var(--surface)', color: 'var(--ink)', opacity: 0.75 }}
    >
        {children}
    </button>
);

export default PillButton;
