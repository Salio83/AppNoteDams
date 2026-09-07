import React, { useState } from 'react';

// Vacances scolaires Zone C (Montpellier) 2025-2026
const VACANCES = [
    { id: 'noel-2025', name: 'Vacances de Noël', start: '2025-12-20', end: '2026-01-05', type: 'vacation' },
    { id: 'hiver-2026', name: "Vacances d'hiver", start: '2026-02-14', end: '2026-03-02', type: 'vacation' },
    { id: 'printemps-2026', name: 'Vacances de printemps', start: '2026-04-11', end: '2026-04-27', type: 'vacation' },
    { id: 'ete-2026', name: "Vacances d'été", start: '2026-07-04', end: '2026-08-31', type: 'vacation' }
];

// Jours fériés français 2025-2026
const JOURS_FERIES = [
    { id: 'nouvel-an-2026', name: "Jour de l'An", date: '2026-01-01', type: 'holiday' },
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
    const [filter, setFilter] = useState('all');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const feriesWithCountdown = JOURS_FERIES.map(jf => {
        const date = new Date(jf.date);
        date.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        const status = daysUntil < 0 ? 'past' : daysUntil === 0 ? 'current' : 'upcoming';
        return { ...jf, daysUntil, status };
    });

    const allEvents = [
        ...vacancesWithCountdown.filter(v => v.status !== 'past'),
        ...feriesWithCountdown.filter(jf => jf.status !== 'past')
    ].sort((a, b) => {
        const dateA = a.start ? new Date(a.start) : new Date(a.date);
        const dateB = b.start ? new Date(b.start) : new Date(b.date);
        return dateA - dateB;
    });

    const filteredEvents = filter === 'all' ? allEvents : allEvents.filter(e => e.type === filter);
    const vacationCount = allEvents.filter(e => e.type === 'vacation').length;
    const holidayCount = allEvents.filter(e => e.type === 'holiday').length;

    return (
        <div className="space-y-6">
            <header>
                <h2 className="font-display text-2xl">Calendrier</h2>
                <p className="text-muted text-sm mt-1">Vacances scolaires (Zone C) et jours fériés</p>
            </header>

            <div className="flex flex-wrap items-center gap-4 text-sm">
                {[
                    { value: 'all', label: `Tous (${allEvents.length})` },
                    { value: 'vacation', label: `Vacances (${vacationCount})` },
                    { value: 'holiday', label: `Jours fériés (${holidayCount})` },
                ].map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setFilter(opt.value)}
                        style={{ fontWeight: filter === opt.value ? 700 : 400 }}
                        className={filter === opt.value ? '' : 'opacity-55 hover:opacity-100'}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filteredEvents.map((event) => {
                    const family = event.type === 'vacation' ? 't2' : 't3';
                    const daysUntil = event.daysUntilStart ?? event.daysUntil;
                    return (
                        <div
                            key={event.id}
                            className="rounded-[28px] flex flex-wrap items-center gap-x-5 gap-y-2 p-5"
                            style={{ background: `var(--${family}-bg)`, color: `var(--${family}-ink)` }}
                        >
                            <div className="font-display text-[34px] tabular-nums shrink-0">
                                {event.status === 'current' ? '—' : `J-${daysUntil}`}
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <h3 className="text-[18px] font-semibold">
                                    {event.name}{event.status === 'current' ? ' · en cours' : ''}
                                </h3>
                                <p className="text-sm opacity-75 mt-0.5">
                                    {event.start
                                        ? `${new Date(event.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} → ${new Date(event.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                        : new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-[13px] uppercase opacity-75 shrink-0">
                                {event.type === 'vacation' ? 'Vacances' : 'Férié'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
