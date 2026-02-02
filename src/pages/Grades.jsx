import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, AlertCircle, GraduationCap, Plus, ChevronDown, ChevronRight, Loader2, X, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { getUEColor, getCategoryShortName } from '../utils/colors';
import { getNextEventForSubject } from '../utils/scheduleAnalysis';
import ues from '../../config_ue.json';

const Grades = () => {
    const { user } = useAuth();
    const { events: allEvents } = useSchedule();
    const [grades, setGrades] = useState([]);
    const [selectedUE, setSelectedUE] = useState(ues[0]?.id || '');
    const [grade, setGrade] = useState('');
    const [coef, setCoef] = useState('1');
    const [expandedCategories, setExpandedCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Charger les notes depuis l'API
    useEffect(() => {
        const loadGrades = async () => {
            if (!user) return;

            try {
                const data = await api.get('/grades');

                // Transformer les données pour correspondre au format attendu
                const formattedGrades = data.map(g => ({
                    id: g.id,
                    ue_id: parseInt(g.ueId), // Ensure int if needed, or keep as is if string. The original code used parseInt(selectedUE) on insert but map uses g.ue_id.
                    value: g.value,
                    coef: g.coef,
                    date: g.createdAt
                }));

                setGrades(formattedGrades);

                // Ouvrir automatiquement les catégories qui ont des notes
                const categoriesWithGrades = new Set();
                formattedGrades.forEach(g => {
                    const ue = ues.find(u => u.id === g.ue_id);
                    if (ue) categoriesWithGrades.add(ue.category);
                });
                const expanded = {};
                categoriesWithGrades.forEach(cat => expanded[cat] = true);
                setExpandedCategories(expanded);
            } catch (error) {
                console.error('Erreur chargement notes:', error);
            } finally {
                setLoading(false);
            }
        };

        loadGrades();
    }, [user]);

    // Grouper les UEs par catégorie
    const groupedUEs = useMemo(() => {
        return ues.reduce((acc, ue) => {
            const category = ue.category || 'Autres';
            if (!acc[category]) acc[category] = [];
            acc[category].push(ue);
            return acc;
        }, {});
    }, []);

    // Grouper les notes par UE
    const gradesByUE = useMemo(() => {
        return grades.reduce((acc, grade) => {
            if (!acc[grade.ue_id]) acc[grade.ue_id] = [];
            acc[grade.ue_id].push(grade);
            return acc;
        }, {});
    }, [grades]);

    // Calculer la moyenne d'une UE
    const calculateUEAverage = (ueId) => {
        const ueGrades = gradesByUE[ueId] || [];
        if (ueGrades.length === 0) return null;

        let totalWeighted = 0;
        let totalCoef = 0;
        ueGrades.forEach(g => {
            totalWeighted += g.value * g.coef;
            totalCoef += g.coef;
        });
        return totalCoef > 0 ? totalWeighted / totalCoef : null;
    };

    const handleAddGrade = async (e) => {
        e.preventDefault();
        if (!selectedUE || grade === '' || coef === '' || !user) return;

        setSaving(true);
        try {
            const data = await api.post('/grades', {
                ue_id: parseInt(selectedUE),
                value: parseFloat(grade),
                coef: parseFloat(coef)
            });

            const newGrade = {
                id: data.id,
                ue_id: parseInt(data.ueId),
                value: data.value,
                coef: data.coef,
                date: data.createdAt
            };

            setGrades([newGrade, ...grades]);
            setGrade('');
            setCoef('1');

            // Ouvrir la catégorie de l'UE ajoutée
            const ue = ues.find(u => u.id === parseInt(selectedUE));
            if (ue) {
                setExpandedCategories(prev => ({ ...prev, [ue.category]: true }));
            }
        } catch (error) {
            console.error('Erreur ajout note:', error);
            alert('Erreur lors de l\'ajout de la note');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/grades/${id}`);
            setGrades(grades.filter(g => g.id !== id));
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const getUEName = (id) => ues.find(ue => ue.id === id)?.nom || 'Inconnu';

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-indigo-500" />
                    Gestion des Notes
                </h2>
                <p className="text-gray-500 dark:text-gray-400">Appuyez sur une UE pour voir le détail des matières</p>
            </header>


            {/* Formulaire d'ajout */}
            <form onSubmit={handleAddGrade} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Ajouter une note</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Matière</label>
                        <select
                            value={selectedUE}
                            onChange={(e) => setSelectedUE(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 py-2.5 px-3"
                        >
                            {Object.entries(groupedUEs).map(([category, items]) => (
                                <optgroup key={category} label={getCategoryShortName(category)}>
                                    {items.map(ue => (
                                        <option key={ue.id} value={ue.id}>{ue.nom}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Note /20</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 py-2.5 px-3"
                            placeholder="15.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Coefficient</label>
                        <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={coef}
                            onChange={(e) => setCoef(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 py-2.5 px-3"
                            placeholder="1"
                            required
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-indigo-600 text-white rounded-lg px-6 py-2.5 hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        {saving ? 'Ajout...' : 'Ajouter la note'}
                    </button>
                </div>
            </form>

            {/* Loading state */}
            {loading ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-4">Chargement des notes...</p>
                </div>
            ) : grades.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Aucune note</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Commencez par ajouter une nouvelle note ci-dessus.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(groupedUEs).map(([category, categoryUEs]) => {
                        const colors = getUEColor(category);
                        const hasGrades = categoryUEs.some(ue => gradesByUE[ue.id]?.length > 0);

                        // Calculer la moyenne de la catégorie
                        let categoryTotal = 0;
                        let categoryCoef = 0;
                        categoryUEs.forEach(ue => {
                            const avg = calculateUEAverage(ue.id);
                            if (avg !== null) {
                                categoryTotal += avg * ue.coef_ue;
                                categoryCoef += ue.coef_ue;
                            }
                        });
                        const categoryAverage = categoryCoef > 0 ? categoryTotal / categoryCoef : null;
                        const gradesCount = categoryUEs.reduce((sum, ue) => sum + (gradesByUE[ue.id]?.length || 0), 0);

                        return (
                            <div
                                key={category}
                                onClick={() => setSelectedCategory({ category, categoryUEs, colors, categoryAverage })}
                                className={`${colors.bg} border ${colors.border} rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className={`font-bold text-base ${colors.text}`}>
                                        {getCategoryShortName(category)}
                                    </h3>
                                    {categoryAverage !== null && (
                                        <span className={`text-xl font-bold ${categoryAverage >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {categoryAverage.toFixed(1)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className={`${colors.text} opacity-70`}>
                                        {categoryUEs.length} matière{categoryUEs.length > 1 ? 's' : ''}
                                    </span>
                                    {hasGrades && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                                            {gradesCount} note{gradesCount > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 pt-3 border-t border-current/10 text-xs opacity-60 text-center">
                                    Appuyez pour voir les détails →
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Category Detail Modal */}
            {selectedCategory && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setSelectedCategory(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`p-4 ${selectedCategory.colors.bg} ${selectedCategory.colors.border} border-b`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className={`font-bold text-lg ${selectedCategory.colors.text}`}>
                                        {getCategoryShortName(selectedCategory.category)}
                                    </h3>
                                    <p className={`text-sm opacity-80 ${selectedCategory.colors.text}`}>
                                        {selectedCategory.categoryUEs.length} matières
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedCategory.categoryAverage !== null && (
                                        <span className={`text-2xl font-bold ${selectedCategory.categoryAverage >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {selectedCategory.categoryAverage.toFixed(2)}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="p-2 hover:bg-white/30 dark:hover:bg-black/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content - List of subjects */}
                        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-3">
                            {selectedCategory.categoryUEs.map(ue => {
                                const ueGrades = gradesByUE[ue.id] || [];
                                const ueAverage = calculateUEAverage(ue.id);
                                const nextEvent = getNextEventForSubject(ue, allEvents);

                                return (
                                    <div key={ue.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-800 dark:text-slate-100">{ue.nom}</span>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded">
                                                        Coef {ue.coef_ue}
                                                    </span>
                                                </div>
                                                {/* Lien vers le prochain cours */}
                                                {nextEvent && (
                                                    <Link
                                                        to={`/?date=${new Date(nextEvent.start).toISOString()}&eventId=${new Date(nextEvent.start).getTime()}`}
                                                        className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium mt-1 w-fit"
                                                    >
                                                        <Calendar className="w-3 h-3" />
                                                        Prochain cours: {new Date(nextEvent.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </Link>
                                                )}
                                            </div>
                                            {ueAverage !== null && (
                                                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${ueAverage >= 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {ueAverage.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        {ueGrades.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {ueGrades.map(g => (
                                                    <div
                                                        key={g.id}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${g.value >= 10 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'} group`}
                                                    >
                                                        <span className={`font-bold ${g.value >= 10 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                            {g.value}/20
                                                        </span>
                                                        <span className="text-xs text-slate-500">×{g.coef}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(g.id);
                                                            }}
                                                            className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-100 rounded transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Aucune note</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Grades;
