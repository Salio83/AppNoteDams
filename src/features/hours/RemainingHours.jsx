import React, { useState, useEffect } from 'react';
import { useSchedule } from '../../shared/context/ScheduleContext';

const Tile = ({ label, value }) => (
    <div className="rounded-[28px] bg-surface p-5">
        <p className="text-[12px] uppercase text-muted">{label}</p>
        <p className="font-display text-[34px] tabular-nums mt-1">{value}</p>
    </div>
);

const RemainingHours = () => {
    const { hoursBySubject, loading, error, refreshData } = useSchedule();
    const [semester, setSemester] = useState('S1');

    useEffect(() => {
        const hasData = hoursBySubject.S1.length > 0 || hoursBySubject.S2.length > 0;
        if (!hasData && !loading && !error) refreshData();
    }, [hoursBySubject, loading, error, refreshData]);

    const subjects = [...(hoursBySubject[semester] || [])].sort((a, b) => b.totalHours - a.totalHours);

    const totalCompleted = subjects.reduce((sum, s) => sum + s.hoursCompleted, 0);
    const totalRemaining = subjects.reduce((sum, s) => sum + s.hoursRemaining, 0);
    const totalHours = totalCompleted + totalRemaining;
    const progressPercent = totalHours > 0 ? (totalCompleted / totalHours) * 100 : 0;

    return (
        <div className="space-y-6">
            <header>
                <h2 className="font-display text-2xl">Heures</h2>
            </header>

            <div className="flex flex-wrap items-center gap-4 text-sm">
                {['S1', 'S2'].map(s => (
                    <button
                        key={s}
                        onClick={() => setSemester(s)}
                        style={{ fontWeight: semester === s ? 700 : 400 }}
                        className={semester === s ? '' : 'opacity-55 hover:opacity-100'}
                    >
                        Semestre {s.slice(1)}
                    </button>
                ))}
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <Tile label="Effectuées" value={`${totalCompleted.toFixed(1)} h`} />
                <Tile label="Restantes" value={`${totalRemaining.toFixed(1)} h`} />
                <Tile label="Avancement" value={`${progressPercent.toFixed(0)} %`} />
            </div>

            {loading ? (
                <p className="text-muted text-sm">Chargement…</p>
            ) : subjects.length === 0 ? (
                <div className="rounded-[28px] bg-surface p-8 text-center">
                    <p className="text-muted">Aucune matière détectée pour ce semestre.</p>
                </div>
            ) : (
                <div>
                    <h3 className="font-display text-[22px] pb-2 border-b border-rule">Par matière</h3>
                    {subjects.map(subject => {
                        const percent = subject.totalHours > 0 ? (subject.hoursCompleted / subject.totalHours) * 100 : 0;
                        return (
                            <div key={subject.id} className="py-3 border-b border-rule">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <span className="flex-1 min-w-0">{subject.nom}</span>
                                    <span className="tabular-nums text-sm shrink-0 whitespace-nowrap">
                                        {subject.hoursCompleted.toFixed(1)} / {subject.totalHours.toFixed(1)} h
                                    </span>
                                </div>
                                <div className="h-[6px] rounded-full" style={{ background: 'var(--rule)' }}>
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${percent}%`, background: 'var(--accent-solid)' }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RemainingHours;
