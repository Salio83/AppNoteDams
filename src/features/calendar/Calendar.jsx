import React, { useState } from 'react';
import { CalendarDays, Umbrella, Flag, Clock, ChevronRight } from 'lucide-react';

// Vacances scolaires Zone C (Montpellier) 2025-2026
const VACANCES = [
    {
        id: 'noel-2025',
        name: 'Vacances de Noël',
        start: '2025-12-20',
        end: '2026-01-05',
        type: 'vacation'
    },
    {
        id: 'hiver-2026',
        name: "Vacances d'hiver",
        start: '2026-02-14',
        end: '2026-03-02',
        type: 'vacation'
    },
    {
        id: 'printemps-2026',
        name: 'Vacances de printemps',
        start: '2026-04-11',
        end: '2026-04-27',
        type: 'vacation'
    },
    {
        id: 'ete-2026',
        name: "Vacances d'été",
        start: '2026-07-04',
        end: '2026-08-31',
        type: 'vacation'
    }
];

// Jours fériés français 2025-2026
const JOURS_FERIES = [
    { id: 'nouvel-an-2026', name: 'Jour de l\'An', date: '2026-01-01', type: 'holiday' },
    { id: 'paques-2026', name: 'Lundi de Pâques', date: '2026-04-06', type: 'holiday' },
    { id: 'travail-2026', name: 'Fête du Travail', date: '2026-05-01', type: 'holiday' },
    { id: 'victoire-2026', name: 'Victoire 1945', date: '2026-05-08', type: 'holiday' },
    { id: 'ascension-2026', name: 'Ascension', date: '2026-05-14', type: 'holiday' },
    { id: 'pentecote-2026', name: 'Lundi de Pentecôte', date: '2026-05-25', type: 'holiday' },
    { id: 'fete-nat-2026', name: 'Fête Nationale', date: '2026-07-14', type: 'holiday' },
    { id: 'assomption-2026', name: 'Assomption', date: '2026-08-15', type: 'holiday' },
    { id: 'toussaint-2026', name: 'Toussaint', date: '2026-11-01', type: 'holiday' },
    { id: 'armistice-2026', name: 'Armistice 1918', date: '2026-11-11', type: 'holiday' },
    { id: 'noel-2026', name: 'Noël', date: '2026-12-25', type: 'holiday' }
];

const Calendar = () => {
    const [filter, setFilter] = useState('all'); // 'all', 'vacation', 'holiday'
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculer les jours restants pour vacances (périodes)
    const vacancesWithCountdown = VACANCES.map(v => {
        const startDate = new Date(v.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(v.end);
        endDate.setHours(0, 0, 0, 0);

        const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
        const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        let status = 'upcoming';
        if (daysUntilEnd < 0) status = 'past';
        else if (daysUntilStart <= 0 && daysUntilEnd >= 0) status = 'current';

        return { ...v, daysUntilStart, daysUntilEnd, status };
    });

    // Calculer les jours restants pour jours fériés
    const feriesWithCountdown = JOURS_FERIES.map(jf => {
        const date = new Date(jf.date);
        date.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        const status = daysUntil < 0 ? 'past' : daysUntil === 0 ? 'current' : 'upcoming';
        return { ...jf, daysUntil, status };
    });

    // Filtrer et trier tous les événements
    const allEvents = [
        ...vacancesWithCountdown.filter(v => v.status !== 'past'),
        ...feriesWithCountdown.filter(jf => jf.status !== 'past')
    ].sort((a, b) => {
        const dateA = a.start ? new Date(a.start) : new Date(a.date);
        const dateB = b.start ? new Date(b.start) : new Date(b.date);
        return dateA - dateB;
    });

    const filteredEvents = filter === 'all'
        ? allEvents
        : allEvents.filter(e => e.type === filter);

    const vacationCount = allEvents.filter(e => e.type === 'vacation').length;
    const holidayCount = allEvents.filter(e => e.type === 'holiday').length;

    // Trouver le prochain événement
    const nextEvent = allEvents.find(e =>
        (e.type === 'vacation' && e.daysUntilStart > 0) ||
        (e.type === 'holiday' && e.daysUntil > 0)
    );

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-teal-500" />
                    Calendrier
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Vacances scolaires (Zone C - Montpellier) et jours fériés
                </p>
            </header>

            {/* Prochain événement */}
            {nextEvent && (
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-teal-100 text-sm font-medium mb-1">Prochain événement</p>
                            <p className="text-xl font-bold">{nextEvent.name}</p>
                            <p className="text-teal-100 text-sm mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {nextEvent.start
                                    ? `${new Date(nextEvent.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${new Date(nextEvent.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                                    : new Date(nextEvent.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                                }
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-bold">
                                J-{nextEvent.daysUntilStart ?? nextEvent.daysUntil}
                            </p>
                            <p className="text-teal-100 text-xs">jours</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                >
                    Tous ({allEvents.length})
                </button>
                <button
                    onClick={() => setFilter('vacation')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filter === 'vacation'
                        ? 'bg-teal-600 text-white'
                        : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50'
                        }`}
                >
                    <Umbrella className="w-4 h-4" />
                    Vacances ({vacationCount})
                </button>
                <button
                    onClick={() => setFilter('holiday')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filter === 'holiday'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                        }`}
                >
                    <Flag className="w-4 h-4" />
                    Jours fériés ({holidayCount})
                </button>
            </div>

            {/* Liste des événements */}
            <div className="space-y-3">
                {filteredEvents.map((event) => (
                    <div
                        key={event.id}
                        className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${event.status === 'current'
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${event.type === 'vacation'
                                    ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400'
                                    : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                                    }`}>
                                    {event.type === 'vacation'
                                        ? <Umbrella className="w-5 h-5" />
                                        : <Flag className="w-5 h-5" />
                                    }
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                                        {event.name}
                                        {event.status === 'current' && (
                                            <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-emerald-500 text-white rounded-full">
                                                En cours
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {event.start
                                            ? `${new Date(event.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} → ${new Date(event.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                            : new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                {event.status === 'current' ? (
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Maintenant</p>
                                ) : (
                                    <>
                                        <p className="text-xl font-bold text-slate-700 dark:text-slate-200">
                                            J-{event.daysUntilStart ?? event.daysUntil}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">jours</p>
                                    </>
                                )}
                            </div>
                        </div>
                        {event.type === 'vacation' && event.status === 'current' && (
                            <div className="mt-3 pt-3 border-t border-emerald-200">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-emerald-600">Fin des vacances</span>
                                    <span className="font-semibold text-emerald-700">
                                        {new Date(event.end).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        <span className="text-emerald-500 ml-1">(J-{event.daysUntilEnd})</span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Note Zone C */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-500 dark:text-slate-400">
                <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">📍 Zone C</p>
                <p>
                    Académies : Montpellier, Toulouse, Bordeaux, Limoges, Paris, Versailles, Créteil
                </p>
            </div>
        </div>
    );
};

export default Calendar;
