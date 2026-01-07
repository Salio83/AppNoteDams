import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Clock, MapPin, RefreshCw, Info } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

const Exams = () => {
    const { exams, loading, error, lastUpdated, refreshData, getCacheAge } = useSchedule();
    const [filter, setFilter] = useState('all'); // 'all', 'S1', 'S2'

    // Charger les données au premier rendu si pas encore chargées
    useEffect(() => {
        if (exams.length === 0 && !loading && !error) {
            refreshData();
        }
    }, []);

    const getUrgencyClass = (daysUntil) => {
        if (daysUntil <= 3) return 'bg-red-100 border-red-300 text-red-800';
        if (daysUntil <= 7) return 'bg-orange-100 border-orange-300 text-orange-800';
        if (daysUntil <= 14) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        return 'bg-emerald-100 border-emerald-300 text-emerald-800';
    };

    const getUrgencyBadge = (daysUntil) => {
        if (daysUntil <= 3) return { text: 'Urgent', class: 'bg-red-500' };
        if (daysUntil <= 7) return { text: 'Cette semaine', class: 'bg-orange-500' };
        if (daysUntil <= 14) return { text: 'Bientôt', class: 'bg-yellow-500' };
        return { text: 'À venir', class: 'bg-emerald-500' };
    };

    const filteredExams = filter === 'all'
        ? exams
        : exams.filter(e => e.semester === filter);

    const s1Count = exams.filter(e => e.semester === 'S1').length;
    const s2Count = exams.filter(e => e.semester === 'S2').length;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        Examens détectés
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Détection automatique depuis votre emploi du temps
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

            {/* Filtres semestre */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    Tous ({exams.length})
                </button>
                <button
                    onClick={() => setFilter('S1')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'S1'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                >
                    Semestre 1 ({s1Count})
                </button>
                <button
                    onClick={() => setFilter('S2')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'S2'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                >
                    Semestre 2 ({s2Count})
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-3 border border-rose-100">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : filteredExams.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        Aucun examen détecté
                    </h3>
                    <p className="text-slate-500">
                        Les examens sont détectés automatiquement via les mots-clés : examen, DS, amphi, contrôle, partiel
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredExams.map((exam, index) => {
                        const urgency = getUrgencyBadge(exam.daysUntil);
                        return (
                            <div
                                key={index}
                                className={`rounded-xl border-2 p-5 transition-all hover:shadow-md ${getUrgencyClass(exam.daysUntil)}`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${urgency.class}`}>
                                                {urgency.text}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/50">
                                                {exam.semester}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-1">{exam.title}</h3>
                                        {exam.location && (
                                            <p className="flex items-center gap-1 text-sm opacity-80">
                                                <MapPin className="w-4 h-4" />
                                                {exam.location}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 justify-end mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span className="font-semibold">
                                                {new Date(exam.start).toLocaleDateString('fr-FR', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end text-sm opacity-80">
                                            <Clock className="w-4 h-4" />
                                            {new Date(exam.start).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            {' - '}
                                            {new Date(exam.end).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <p className="mt-2 text-2xl font-bold">
                                            J-{exam.daysUntil}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Exams;
