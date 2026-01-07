import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, BookOpen, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

const RemainingHours = () => {
    const { hoursBySubject, loading, error, lastUpdated, refreshData, getCacheAge } = useSchedule();
    const [semester, setSemester] = useState('S1'); // 'S1' ou 'S2'
    const [selectedSubject, setSelectedSubject] = useState(null);

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
                        Appuyez sur une matière pour voir les détails
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
            <div className="flex gap-2 flex-wrap">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium text-sm">Effectuées</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-800">{totalCompleted.toFixed(1)}h</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium text-sm">Restantes</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-800">{totalRemaining.toFixed(1)}h</p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700 mb-2">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-medium text-sm">Total {semester}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{totalHours.toFixed(1)}h</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((subject) => {
                        const progressPercent = subject.totalHours > 0
                            ? (subject.hoursCompleted / subject.totalHours) * 100
                            : 0;

                        return (
                            <div
                                key={subject.id}
                                onClick={() => setSelectedSubject(subject)}
                                className="bg-white rounded-xl p-4 border border-slate-200/60 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-slate-800 truncate pr-2">{subject.nom}</span>
                                    <span className="text-sm font-bold text-emerald-600 shrink-0">
                                        {progressPercent.toFixed(0)}%
                                    </span>
                                </div>

                                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>{subject.hoursCompleted.toFixed(1)}h faites</span>
                                    <span>{subject.hoursRemaining.toFixed(1)}h restantes</span>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-400 text-center">
                                    Appuyez pour détails →
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Subject Detail Modal */}
            {selectedSubject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setSelectedSubject(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">{selectedSubject.nom}</h3>
                                    <p className="text-sm opacity-80">{selectedSubject.category}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedSubject(null)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Progress */}
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <p className="text-4xl font-bold text-slate-800">
                                    {((selectedSubject.hoursCompleted / selectedSubject.totalHours) * 100).toFixed(0)}%
                                </p>
                                <p className="text-sm text-slate-500 mt-1">de progression</p>
                                <div className="mt-3 h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                                        style={{ width: `${(selectedSubject.hoursCompleted / selectedSubject.totalHours) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Heures détaillées */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="flex items-center gap-2 text-emerald-700 mb-1">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-xs font-medium">Effectuées</span>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-800">{selectedSubject.hoursCompleted.toFixed(1)}h</p>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-medium">Restantes</span>
                                    </div>
                                    <p className="text-2xl font-bold text-amber-800">{selectedSubject.hoursRemaining.toFixed(1)}h</p>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">Total prévu</p>
                                    <p className="text-sm text-slate-500">{selectedSubject.totalHours.toFixed(1)} heures</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemainingHours;
