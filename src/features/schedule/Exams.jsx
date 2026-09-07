import React, { useEffect } from 'react';
import { useSchedule } from '../../shared/context/ScheduleContext';

const getUrgency = (daysUntil) => {
    if (daysUntil <= 7) return { family: 't4', label: 'Cette semaine' };
    if (daysUntil <= 14) return { family: 't1', label: 'Bientôt' };
    return { family: 't3', label: 'À venir' };
};

const Exams = () => {
    const { exams, loading, error, refreshData } = useSchedule();

    useEffect(() => {
        if (exams.length === 0 && !loading && !error) refreshData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sortedExams = [...exams].sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <div className="space-y-6">
            <header>
                <h2 className="font-display text-2xl">Examens</h2>
                <p className="text-muted text-sm mt-1">
                    {exams.length} examen{exams.length > 1 ? 's' : ''} à venir
                </p>
            </header>

            {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}

            {loading ? (
                <p className="text-muted text-sm">Chargement…</p>
            ) : sortedExams.length === 0 ? (
                <div className="rounded-[28px] bg-surface p-8 text-center">
                    <p className="text-muted">Aucun examen détecté pour l'instant.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedExams.map((exam, index) => {
                        const urgency = getUrgency(exam.daysUntil);
                        return (
                            <div
                                key={index}
                                className="rounded-[28px] flex flex-wrap items-center gap-x-5 gap-y-2 p-5"
                                style={{ background: `var(--${urgency.family}-bg)`, color: `var(--${urgency.family}-ink)` }}
                            >
                                <div className="font-display text-[34px] tabular-nums shrink-0">
                                    J-{exam.daysUntil}
                                </div>
                                <div className="flex-1 min-w-[160px]">
                                    <h3 className="text-[18px] font-semibold">{exam.title}</h3>
                                    <p className="text-sm opacity-75 mt-0.5">
                                        {new Date(exam.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        {' · '}
                                        {new Date(exam.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        {exam.location ? ` · ${exam.location}` : ''}
                                    </p>
                                </div>
                                <div className="text-[13px] uppercase opacity-75 shrink-0">{urgency.label}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Exams;
