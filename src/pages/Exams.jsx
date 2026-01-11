import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Calendar, Clock, MapPin, RefreshCw, Info, X } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

const Exams = () => {
    const { exams, loading, error, lastUpdated, refreshData, getCacheAge } = useSchedule();
    const [selectedExam, setSelectedExam] = useState(null);

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

    // Tous les examens triés chronologiquement
    const sortedExams = [...exams].sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        Examens détectés
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {exams.length} examen{exams.length > 1 ? 's' : ''} à venir • Appuyez pour voir les détails
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
            ) : sortedExams.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        Aucun examen détecté
                    </h3>
                    <p className="text-slate-500">
                        Les examens sont détectés via : examen, DS, épreuve, partiel, soutenance
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {sortedExams.map((exam, index) => {
                        const urgency = getUrgencyBadge(exam.daysUntil);
                        return (
                            <div
                                key={index}
                                onClick={() => setSelectedExam(exam)}
                                className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${getUrgencyClass(exam.daysUntil)}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${urgency.class}`}>
                                                {urgency.text}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/50">
                                                {exam.semester}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold mb-1 truncate">{exam.title}</h3>
                                        {exam.location && (
                                            <p className="flex items-center gap-1 text-sm opacity-80 truncate">
                                                <MapPin className="w-3 h-3" />
                                                {exam.location}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-2xl font-bold">J-{exam.daysUntil}</p>
                                        <p className="text-xs opacity-70">
                                            {new Date(exam.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-current/10 text-xs opacity-60 text-center">
                                    Appuyez pour détails →
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Exam Detail Modal */}
            {selectedExam && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setSelectedExam(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`p-4 ${getUrgencyClass(selectedExam.daysUntil)} border-b-2`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${getUrgencyBadge(selectedExam.daysUntil).class}`}>
                                            {getUrgencyBadge(selectedExam.daysUntil).text}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/50">
                                            {selectedExam.semester}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg">{selectedExam.title}</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedExam(null)}
                                    className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Countdown */}
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <p className="text-5xl font-bold text-slate-800">J-{selectedExam.daysUntil}</p>
                                <p className="text-sm text-slate-500 mt-1">jours restants</p>
                            </div>

                            {/* Date et heure */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">
                                        {new Date(selectedExam.start).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(selectedExam.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        {' - '}
                                        {new Date(selectedExam.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Durée */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">Durée de l'épreuve</p>
                                    <p className="text-sm text-slate-500">
                                        {Math.round((new Date(selectedExam.end) - new Date(selectedExam.start)) / (1000 * 60))} minutes
                                    </p>
                                </div>
                            </div>

                            {/* Lieu */}
                            {selectedExam.location && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">Lieu</p>
                                        <p className="text-sm text-slate-500">{selectedExam.location}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <Link
                                            to={`/schedule?date=${new Date(selectedExam.start).toISOString()}&eventId=${new Date(selectedExam.start).getTime()}`}
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                                        >
                                            <Calendar className="w-5 h-5" />
                                            Voir sur l'emploi du temps
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Exams;
