import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, RefreshCw, BookOpen, CheckCircle, AlertCircle, Info, X, Calendar } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

const RemainingHours = () => {
    const { hoursBySubject, loading, error, lastUpdated, refreshData, getCacheAge } = useSchedule();
    const [semester, setSemester] = useState('S1'); // 'S1' ou 'S2'
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Charger les données au premier rendu si pas encore chargées
    useEffect(() => {
        const hasData = hoursBySubject.S1.length > 0 || hoursBySubject.S2.length > 0;
        if (!hasData && !loading && !error) {
            refreshData();
        }
    }, [hoursBySubject, loading, error, refreshData]);

    const subjects = hoursBySubject[semester] || [];

    // Grouper par catégorie (UE)
    const groupedSubjects = subjects.reduce((acc, subject) => {
        const cat = subject.category || "AUTRES / NON CLASSÉ";
        if (!acc[cat]) {
            acc[cat] = {
                name: cat,
                subjects: [],
                hoursCompleted: 0,
                hoursRemaining: 0,
                totalHours: 0
            };
        }
        acc[cat].subjects.push(subject);
        acc[cat].hoursCompleted += subject.hoursCompleted;
        acc[cat].hoursRemaining += subject.hoursRemaining;
        acc[cat].totalHours += subject.totalHours;
        return acc;
    }, {});

    const categories = Object.values(groupedSubjects).sort((a, b) => b.totalHours - a.totalHours);

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
                        Appuyez sur une UE pour voir le détail par matière
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
                    <span className="block text-xs opacity-80">Jusqu'au 27 janvier</span>
                </button>
                <button
                    onClick={() => setSemester('S2')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${semester === 'S2'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                >
                    <span className="text-lg">Semestre 2</span>
                    <span className="block text-xs opacity-80">À partir du 28 janvier</span>
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
            ) : categories.length === 0 ? (
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {categories.map((ue) => {
                        const progressPercent = ue.totalHours > 0
                            ? (ue.hoursCompleted / ue.totalHours) * 100
                            : 0;

                        return (
                            <div
                                key={ue.name}
                                onClick={() => setSelectedCategory(ue)}
                                className="bg-white rounded-xl p-5 border border-slate-200/60 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all group"
                            >
                                <div className="flex flex-col gap-2 mb-3">
                                    <h3 className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                        {ue.name}
                                    </h3>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">{ue.subjects.length} matières</span>
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                            {progressPercent.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs font-medium text-slate-500">
                                    <span>{ue.hoursCompleted.toFixed(1)}h faites</span>
                                    <span>{ue.hoursRemaining.toFixed(1)}h restantes</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* UE Detail Modal */}
            {selectedCategory && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setSelectedCategory(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-xl leading-tight">{selectedCategory.name}</h3>
                                    <div className="flex gap-4 mt-2 text-indigo-100 text-sm">
                                        <span>{selectedCategory.subjects.length} matières</span>
                                        <span>•</span>
                                        <span>{selectedCategory.totalHours.toFixed(1)}h Total</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                                    <p className="text-emerald-700 text-xs font-bold uppercase mb-1">Effectuées</p>
                                    <p className="text-2xl font-bold text-emerald-800">{selectedCategory.hoursCompleted.toFixed(1)}h</p>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center">
                                    <p className="text-amber-700 text-xs font-bold uppercase mb-1">Restantes</p>
                                    <p className="text-2xl font-bold text-amber-800">{selectedCategory.hoursRemaining.toFixed(1)}h</p>
                                </div>
                            </div>

                            <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Détail par matière</h4>

                            <div className="space-y-3">
                                {selectedCategory.subjects.map(subject => {
                                    const subProgress = subject.totalHours > 0
                                        ? (subject.hoursCompleted / subject.totalHours) * 100
                                        : 0;

                                    return (
                                        <div key={subject.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-slate-800 text-sm">{subject.nom}</span>
                                                <span className="text-xs font-bold px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-600">
                                                    {subProgress.toFixed(0)}%
                                                </span>
                                            </div>

                                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${subProgress}%` }}
                                                />
                                            </div>

                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Fait: {subject.hoursCompleted.toFixed(1)}h</span>
                                                <span className={subject.hoursRemaining > 0 ? "text-amber-600 font-medium" : "text-emerald-600 font-medium"}>
                                                    Reste: {subject.hoursRemaining.toFixed(1)}h
                                                </span>
                                            </div>

                                            {/* Bouton Prochain Cours */}
                                            {subject.nextEvent && (
                                                <Link
                                                    to={`/?date=${new Date(subject.nextEvent.start).toISOString()}&eventId=${new Date(subject.nextEvent.start).getTime()}`}
                                                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors w-full justify-center border border-indigo-100"
                                                >
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Prochain cours: {new Date(subject.nextEvent.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemainingHours;


