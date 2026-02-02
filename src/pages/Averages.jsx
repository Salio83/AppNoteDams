import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ues from '../../config_ue.json';
import { BookOpen, Award, TrendingUp, Loader2 } from 'lucide-react';

const Averages = () => {
    const { user } = useAuth();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGrades = async () => {
            if (!user) return;

            try {
                const data = await api.get('/grades');

                setGrades(data.map(g => ({
                    id: g.id,
                    ue_id: parseInt(g.ueId),
                    value: g.value,
                    coef: g.coef
                })));
            } catch (error) {
                console.error('Erreur chargement:', error);
            } finally {
                setLoading(false);
            }
        };

        loadGrades();
    }, [user]);

    const groupedData = useMemo(() => {
        // 1. Group UEs by category
        const ueByCat = ues.reduce((acc, ue) => {
            const cat = ue.category || 'Autres';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(ue);
            return acc;
        }, {});

        // 2. Calculate stats for each UE in each category
        const data = Object.entries(ueByCat).map(([category, ueList]) => {
            const uesWithStats = ueList.map(ue => {
                // Get grades for this UE (which is actually a subject in the config logic used so far?)
                // Wait, config_ue.json seems to list SUBJECTS (Matières) but calls them UEs?
                // Let's re-read config: 
                // { "id": 101, "category": "UE ENTREPRISE...", "nom": "Culture éco...", "coef_ue": 2 }
                // So "UE ENTREPRISE..." is the UE, and "Culture..." is the Subject (Module).
                // The coef_ue is likely the coefficient of the Subject within the UE, OR the UE coefficient?
                // Standard usage: UE lists Subjects. 
                // Let's assume the user wants to see:
                // UE Title (Category) -> Average of that UE
                //   - Subject 1 (Nom) -> Grade | Avg

                // Let's group grades by this specific Subject ID (ue.id)
                const subjectGrades = grades.filter(g => g.ue_id === ue.id);

                if (subjectGrades.length === 0) {
                    return { ...ue, average: null, grades: [] };
                }

                const sumCoefs = subjectGrades.reduce((sum, g) => sum + g.coef, 0);
                const sumWeighted = subjectGrades.reduce((sum, g) => sum + (g.value * g.coef), 0);
                const avg = sumWeighted / sumCoefs;

                return {
                    ...ue,
                    average: parseFloat(avg.toFixed(2)),
                    grades: subjectGrades
                };
            });

            // Calculate Category (Real UE) Average
            // If coef_ue is the coefficient of the subject inside the UE
            const validSubjects = uesWithStats.filter(u => u.average !== null);
            let ueaverage = null;

            if (validSubjects.length > 0) {
                const totalCoef = validSubjects.reduce((sum, u) => sum + u.coef_ue, 0);
                const totalWeighted = validSubjects.reduce((sum, u) => sum + (u.average * u.coef_ue), 0);
                ueaverage = parseFloat((totalWeighted / totalCoef).toFixed(2));
            }

            return {
                category,
                ueAverage: ueaverage,
                subjects: uesWithStats
            };
        });

        return data;
    }, [grades]);

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Moyennes Détaillées</h2>
                <p className="text-slate-500 dark:text-slate-400">Vue d'ensemble par Unité d'Enseignement</p>
            </header>

            <div className="grid gap-8">
                {groupedData.map((group) => (
                    <div key={group.category} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="bg-slate-50/50 dark:bg-slate-700/50 p-6 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-500" />
                                {group.category}
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Moyenne UE</span>
                                <span className={`text-xl font-bold px-3 py-1 rounded-lg ${group.ueAverage === null ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500' :
                                    group.ueAverage >= 10 ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                                    }`}>
                                    {group.ueAverage !== null ? group.ueAverage : '-'}
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-50 dark:divide-slate-700">
                            {group.subjects.map(subject => (
                                <div key={subject.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-slate-800 dark:text-slate-200">{subject.nom}</h4>
                                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded font-medium border border-slate-200 dark:border-slate-600">
                                                Coef {subject.coef_ue}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {subject.grades.map(g => (
                                                <span key={g.id} className={`text-xs px-2 py-1 rounded border ${g.value >= 10 ? 'bg-white dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-rose-900/30 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                                                    }`}>
                                                    {g.value} <span className="text-slate-300 dark:text-slate-600 mx-0.5">|</span> <span className="text-slate-400 dark:text-slate-500">x{g.coef}</span>
                                                </span>
                                            ))}
                                            {subject.grades.length === 0 && (
                                                <span className="text-xs text-slate-400 dark:text-slate-500 italic">Aucune note</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 sm:border-l sm:border-slate-100 dark:sm:border-slate-700 sm:pl-6 shrink-0 min-w-[100px] justify-end">
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${subject.average === null ? 'text-slate-200 dark:text-slate-600' :
                                                subject.average >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                                                }`}>
                                                {subject.average !== null ? subject.average : '--'}
                                            </div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">Moyenne</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Averages;
