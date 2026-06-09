import React, { useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

/**
 * Composant Tile - Tuile cliquable avec expansion de détails
 * 
 * @param {React.ReactNode} children - Contenu résumé de la tuile
 * @param {React.ReactNode} expandedContent - Contenu détaillé affiché au clic
 * @param {string} className - Classes CSS additionnelles
 * @param {string} colorClass - Classes de couleur (bg, border, etc.)
 * @param {boolean} disabled - Désactiver l'interaction
 * @param {function} onClick - Callback optionnel au clic (si pas d'expandedContent)
 */
const Tile = ({
    children,
    expandedContent,
    className = '',
    colorClass = 'bg-white border-slate-200/60',
    disabled = false,
    onClick,
    title
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleClick = () => {
        if (disabled) return;
        if (onClick) {
            onClick();
        } else if (expandedContent) {
            setIsExpanded(true);
        }
    };

    const handleClose = (e) => {
        e.stopPropagation();
        setIsExpanded(false);
    };

    return (
        <>
            {/* Tuile principale */}
            <div
                onClick={handleClick}
                className={clsx(
                    'rounded-xl border transition-all duration-200',
                    !disabled && 'cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]',
                    disabled && 'opacity-60 cursor-not-allowed',
                    colorClass,
                    className
                )}
            >
                {children}
            </div>

            {/* Modal de détails */}
            {isExpanded && expandedContent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={handleClose}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header du modal */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title || 'Détails'}</h3>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Contenu du modal */}
                        <div className="p-5 overflow-y-auto max-h-[calc(80vh-60px)]">
                            {expandedContent}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

/**
 * Composant TileGrid - Grille responsive de tuiles
 */
export const TileGrid = ({ children, className = '' }) => (
    <div className={clsx('grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', className)}>
        {children}
    </div>
);

/**
 * Composant TileSection - Section de détail dans le modal
 */
export const TileSection = ({ title, icon: Icon, children, className = '' }) => (
    <div className={clsx('mb-4 last:mb-0', className)}>
        <div className="flex items-center gap-2 mb-2">
            {Icon && <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{title}</h4>
        </div>
        <div className="text-slate-700 dark:text-slate-300">
            {children}
        </div>
    </div>
);

/**
 * Composant TileInfo - Ligne d'information dans le modal
 */
export const TileInfo = ({ label, value, colorClass = '' }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        <span className={clsx('font-semibold', colorClass || 'text-slate-800 dark:text-slate-200')}>{value}</span>
    </div>
);

export default Tile;