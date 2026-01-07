import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, BookOpen, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

const RemainingHours = () => {
    const { hoursBySubject, loading, error, lastUpdated, refreshData, getCacheAge } = useSchedule();
    const [semester, setSemester] = useState('S1'); // 'S1' ou 'S2'

    // Charger les données au premier rendu si pas encore chargées
    useEffect(() => {
        const hasData = hoursBySubject.S1.length > 0 || hoursBySubject.S2.length > 0;
        if (!hasData && !loading && !error) {
            refreshData();
        }
    }, []);

    const subjects = hoursBySubject[semester] || [];

    // Grouper par catégorie
    const groupedSubjects = subjects.reduce((acc, subject) => {
        const cat = subject.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(subject);
        return acc;
    }, {});

    const totalCompleted = subjects.reduce((sum, s) => sum + s.hoursCompleted, 0);
    const totalRemaining = subjects.reduce((sum, s) => sum + s.hoursRemaining, 0);
    const totalHours = totalCompleted + totalRemaining;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-indigo-500" />
                        Heures restantes
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Suivi des heures de cours par matière
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Cache: {getCacheAge()}
                        </div>
                    )}
                    <button
                        onClick={() => refreshData(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                </div>
            </header>

            {/* Sélection semestre */}
            <div className="flex gap-2">
                <button
                    onClick={() => setSemester('S1')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${semester === 'S1'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                >
                    <span className="text-lg">Semestre 1</span>
                    <span className="block text-xs opacity-80">Jusqu'au 22 janvier</span>
                </button>
                <button
                    onClick={() => setSemester('S2')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${semester === 'S2'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                >
                    <span className="text-lg">Semestre 2</span>
                    <span className="block text-xs opacity-80">À partir du 23 janvier</span>
                </button>
            </div>

            {/* Résumé global */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Heures effectuées</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-800">{totalCompleted.toFixed(1)}h</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Heures restantes</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-800">{totalRemaining.toFixed(1)}h</p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700 mb-2">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-medium">Total {semester}</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{totalHours.toFixed(1)}h</p>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-3 border border-rose-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : subjects.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        Aucune matière détectée pour {semester}
                    </h3>
                    <p className="text-slate-500">
                        Les heures sont calculées automatiquement depuis votre emploi du temps
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedSubjects).map(([category, categorySubjects]) => (
                        <div key={category} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                                    {category}
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {categorySubjects.map((subject) => {
                                    const progressPercent = subject.totalHours > 0
                                        ? (subject.hoursCompleted / subject.totalHours) * 100
                                        : 0;

                                    return (
                                        <div key={subject.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-800">{subject.nom}</span>
                                                <div className="text-sm text-slate-500">
                                                    <span className="text-emerald-600 font-semibold">{subject.hoursCompleted.toFixed(1)}h</span>
                                                    <span className="mx-1">/</span>
                                                    <span>{subject.totalHours.toFixed(1)}h</span>
                                                </div>
                                            </div>
                                            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1 text-xs text-slate-400">
                                                <span>{progressPercent.toFixed(0)}% effectué</span>
                                                <span>{subject.hoursRemaining.toFixed(1)}h restantes</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RemainingHours;
