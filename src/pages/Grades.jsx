import React, { useEffect, useState, useMemo } from 'react';
import { Trash2, AlertCircle, GraduationCap, Plus, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getUEColor, getCategoryShortName } from '../utils/colors';
import ues from '../../config_ue.json';

const Grades = () => {
    const { user } = useAuth();
    const [grades, setGrades] = useState([]);
    const [selectedUE, setSelectedUE] = useState(ues[0]?.id || '');
    const [grade, setGrade] = useState('');
    const [coef, setCoef] = useState('1');
    const [expandedCategories, setExpandedCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Charger les notes depuis Supabase
    useEffect(() => {
        const loadGrades = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('grades')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transformer les données pour correspondre au format attendu
                const formattedGrades = data.map(g => ({
                    id: g.id,
                    ue_id: g.ue_id,
                    value: parseFloat(g.value),
                    coef: parseFloat(g.coef),
                    date: g.created_at
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
            const { data, error } = await supabase
                .from('grades')
                .insert({
                    user_id: user.id,
                    ue_id: parseInt(selectedUE),
                    value: parseFloat(grade),
                    coef: parseFloat(coef)
                })
                .select()
                .single();

            if (error) throw error;

            const newGrade = {
                id: data.id,
                ue_id: data.ue_id,
                value: parseFloat(data.value),
                coef: parseFloat(data.coef),
                date: data.created_at
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
            const { error } = await supabase
                .from('grades')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setGrades(grades.filter(g => g.id !== id));
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const getUEName = (id) => ues.find(ue => ue.id === id)?.nom || 'Inconnu';

    // Migration depuis localStorage
    const [localGrades, setLocalGrades] = useState([]);
    const [migrating, setMigrating] = useState(false);

    useEffect(() => {
        // Vérifier s'il y a des notes dans localStorage
        try {
            const stored = localStorage.getItem('student_dashboard_grades');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setLocalGrades(parsed);
                }
            }
        } catch (e) {
            console.error('Erreur lecture localStorage:', e);
        }
    }, []);

    const handleMigration = async () => {
        if (!user || localGrades.length === 0) return;

        setMigrating(true);
        try {
            // Insérer toutes les notes en batch
            const gradesToInsert = localGrades.map(g => ({
                user_id: user.id,
                ue_id: g.ue_id,
                value: g.value,
                coef: g.coef
            }));

            const { data, error } = await supabase
                .from('grades')
                .insert(gradesToInsert)
                .select();

            if (error) throw error;

            // Mettre à jour l'état local
            const formattedGrades = data.map(g => ({
                id: g.id,
                ue_id: g.ue_id,
                value: parseFloat(g.value),
                coef: parseFloat(g.coef),
                date: g.created_at
            }));

            setGrades(prev => [...formattedGrades, ...prev]);

            // Supprimer de localStorage
            localStorage.removeItem('student_dashboard_grades');
            setLocalGrades([]);

            alert(`${data.length} notes migrées avec succès !`);
        } catch (error) {
            console.error('Erreur migration:', error);
            alert('Erreur lors de la migration: ' + error.message);
        } finally {
            setMigrating(false);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-indigo-500" />
                    Gestion des Notes
                </h2>
                <p className="text-gray-500">Ajoutez et consultez vos résultats par matière</p>
            </header>

            {/* Bannière de migration */}
            {localGrades.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-amber-800">
                                {localGrades.length} notes trouvées en local
                            </p>
                            <p className="text-sm text-amber-600">
                                Migrez-les vers votre compte pour les synchroniser
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleMigration}
                        disabled={migrating}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {migrating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {migrating ? 'Migration...' : 'Migrer les notes'}
                    </button>
                </div>
            )}

            {/* Formulaire d'ajout */}
            <form onSubmit={handleAddGrade} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60">
                <h3 className="font-semibold text-slate-700 mb-4">Ajouter une note</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Matière</label>
                        <select
                            value={selectedUE}
                            onChange={(e) => setSelectedUE(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 py-2.5 px-3"
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
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Note /20</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 py-2.5 px-3"
                            placeholder="15.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Coefficient</label>
                        <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={coef}
                            onChange={(e) => setCoef(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 py-2.5 px-3"
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
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-slate-500 text-sm mt-4">Chargement des notes...</p>
                </div>
            ) : grades.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Aucune note</h3>
                    <p className="text-slate-500 text-sm mt-1">Commencez par ajouter une nouvelle note ci-dessus.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedUEs).map(([category, categoryUEs]) => {
                        const colors = getUEColor(category);
                        const hasGrades = categoryUEs.some(ue => gradesByUE[ue.id]?.length > 0);
                        const isExpanded = expandedCategories[category];

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

                        return (
                            <div key={category} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                                {/* Header de catégorie */}
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className={`w-full flex items-center justify-between p-4 ${colors.bg} border-b ${colors.border} hover:opacity-90 transition-opacity`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                            <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                                        ) : (
                                            <ChevronRight className={`w-5 h-5 ${colors.text}`} />
                                        )}
                                        <h3 className={`font-semibold ${colors.text}`}>
                                            {getCategoryShortName(category)}
                                        </h3>
                                        {hasGrades && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                {categoryUEs.reduce((sum, ue) => sum + (gradesByUE[ue.id]?.length || 0), 0)} notes
                                            </span>
                                        )}
                                    </div>
                                    {categoryAverage !== null && (
                                        <span className={`text-lg font-bold ${categoryAverage >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {categoryAverage.toFixed(2)}/20
                                        </span>
                                    )}
                                </button>

                                {/* Contenu de la catégorie */}
                                {isExpanded && (
                                    <div className="divide-y divide-slate-100">
                                        {categoryUEs.map(ue => {
                                            const ueGrades = gradesByUE[ue.id] || [];
                                            const ueAverage = calculateUEAverage(ue.id);

                                            return (
                                                <div key={ue.id} className="p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-slate-800">{ue.nom}</span>
                                                            <span className="text-xs text-slate-400">(Coef {ue.coef_ue})</span>
                                                        </div>
                                                        {ueAverage !== null && (
                                                            <span className={`text-sm font-bold px-2 py-1 rounded-lg ${ueAverage >= 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                Moyenne: {ueAverage.toFixed(2)}/20
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
                                                                        onClick={() => handleDelete(g.id)}
                                                                        className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-100 rounded transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Supprimer"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 mt-1">Aucune note</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Grades;
