import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useSchedule } from '../../shared/context/ScheduleContext';
import { calculateGlobalAverage } from '../../shared/utils/calculations';
import { getSemester } from '../../shared/utils/scheduleAnalysis';
import { useUEConfig } from '../../shared/hooks/useUEConfig';
import { GradesSetupGuide, ScheduleSetupGuide } from '../../shared/components/SetupGuide';

const Tile = ({ family, label, value, subtitle }) => (
    <div
        className="rounded-[28px]"
        style={{ background: `var(--${family}-bg)`, color: `var(--${family}-ink)`, padding: '20px 22px' }}
    >
        <p className="text-[12px] uppercase tracking-wide opacity-75">{label}</p>
        <p className="font-display text-[34px] leading-tight tabular-nums mt-1">{value}</p>
        {subtitle && <p className="text-[13px] opacity-75 mt-1 truncate">{subtitle}</p>}
    </div>
);

const Home = () => {
    const { ues, hasUEConfig } = useUEConfig();
    const { user } = useAuth();
    const { events, filiere, annee, groupe, hoursBySubject } = useSchedule();
    const [grades, setGrades] = useState([]);
    const [globalAverage, setGlobalAverage] = useState(null);
    const hasSchedule = events && events.length > 0;
    const prenom = user?.name?.split(' ')[0] || '';

    const todayCourses = useMemo(() => {
        if (!events) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return events
            .filter(e => {
                const start = new Date(e.start);
                return start >= today && start < tomorrow;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));
    }, [events]);

    const nextDayWithCourses = useMemo(() => {
        if (!events) return null;
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        const futureEvents = events
            .filter(e => new Date(e.start) > now)
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        if (futureEvents.length === 0) return null;

        const nextDate = new Date(futureEvents[0].start);
        nextDate.setHours(0, 0, 0, 0);
        const endOfNextDay = new Date(nextDate);
        endOfNextDay.setHours(23, 59, 59, 999);

        const nextDayCourses = futureEvents.filter(e => {
            const start = new Date(e.start);
            return start >= nextDate && start <= endOfNextDay;
        });

        return { date: nextDate, courses: nextDayCourses };
    }, [events]);

    const nextExam = useMemo(() => {
        if (!events) return null;
        const now = new Date();

        const exams = events
            .filter(e => {
                const start = new Date(e.start);
                if (start <= now) return false;
                const summary = (e.summary || e.title || '').toLowerCase();
                const location = (e.location || '').toLowerCase();
                return summary.includes('ds') ||
                    summary.includes('exam') ||
                    summary.includes('contrôle') ||
                    location.includes('amphi');
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        return exams[0] || null;
    }, [events]);

    const remainingHours = useMemo(() => {
        const currentSemester = getSemester(new Date());
        const subjects = hoursBySubject?.[currentSemester] || [];
        return subjects.reduce((sum, s) => sum + s.hoursRemaining, 0);
    }, [hoursBySubject]);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                const data = await api.get('/grades');
                const gradesData = data.map(g => ({
                    id: g.id,
                    ue_id: parseInt(g.ueId),
                    value: g.value,
                    coef: g.coef,
                    created_at: g.createdAt
                }));
                setGrades(gradesData);
                setGlobalAverage(calculateGlobalAverage(gradesData, ues));
            } catch (error) {
                console.error('Erreur chargement:', error);
            }
        };
        loadData();
    }, [user, ues]);

    const getUEName = (ueId) => ues.find(ue => ue.id === ueId)?.nom || 'Inconnu';

    const formatDate = (date) => {
        const d = new Date(date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
        if (d.toDateString() === tomorrow.toDateString()) return "Demain";
        return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const formatTime = (date) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const displayCourses = todayCourses.length > 0 ? todayCourses : (nextDayWithCourses?.courses || []);
    const displayDate = todayCourses.length > 0 ? new Date() : nextDayWithCourses?.date;
    const daysUntilExam = nextExam ? Math.ceil((new Date(nextExam.start) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-display" style={{ fontSize: 'clamp(32px,5vw,44px)' }}>
                    Bonjour{prenom ? ` ${prenom}` : ''}
                </h1>
                {filiere && (
                    <p className="text-muted mt-1">
                        {filiere} — {annee}{groupe ? `, groupe ${groupe}` : ''}
                    </p>
                )}
            </header>

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <Tile
                    family="t1"
                    label="Moyenne générale"
                    value={globalAverage !== null ? `${globalAverage.toFixed(2)}/20` : '—'}
                />
                <Tile
                    family="t4"
                    label="Prochain DS"
                    value={daysUntilExam !== null ? `J-${daysUntilExam}` : '—'}
                    subtitle={nextExam ? (nextExam.summary || nextExam.title) : 'Aucun DS prévu'}
                />
                <Tile
                    family="t2"
                    label="Cours aujourd'hui"
                    value={displayCourses.length}
                    subtitle={displayDate ? formatDate(displayDate) : 'Aucun'}
                />
                <Tile
                    family="t3"
                    label="Heures restantes"
                    value={`${remainingHours.toFixed(0)}h`}
                />
            </div>

            {(!hasUEConfig || !hasSchedule) && (
                <div className="space-y-4">
                    {!hasSchedule && <ScheduleSetupGuide />}
                    {!hasUEConfig && <GradesSetupGuide />}
                </div>
            )}

            {hasSchedule && (
                <div className="rounded-[28px] bg-surface p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-display text-[22px]">
                            {displayDate ? formatDate(displayDate) : 'Prochains cours'}
                        </h2>
                        <Link to="/schedule" className="text-sm text-accent">Voir la semaine</Link>
                    </div>
                    <div>
                        {displayCourses.length === 0 ? (
                            <p className="text-muted text-sm py-4">Aucun cours prévu</p>
                        ) : (
                            displayCourses.slice(0, 4).map((course, idx) => (
                                <Link
                                    key={idx}
                                    to="/schedule"
                                    className="flex items-center gap-4 py-3 border-t border-rule first:border-t-0"
                                >
                                    <span className="font-semibold tabular-nums shrink-0">{formatTime(course.start)}</span>
                                    <span className="flex-1 min-w-0 truncate">{course.title || course.summary}</span>
                                    <span className="text-muted text-sm shrink-0">{course.location || '—'}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}

            {hasUEConfig && (
                <div className="rounded-[28px] bg-surface p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-display text-[22px]">Dernières notes</h2>
                        <Link to="/grades" className="text-sm text-accent">Gérer</Link>
                    </div>
                    <div>
                        {grades.length === 0 ? (
                            <p className="text-muted text-sm py-4">Aucune note enregistrée</p>
                        ) : (
                            grades.slice(0, 3).map((grade, idx) => (
                                <Link
                                    key={grade.id || idx}
                                    to="/grades"
                                    className="flex items-center justify-between py-3 border-t border-rule first:border-t-0"
                                >
                                    <span>{getUEName(grade.ue_id)}</span>
                                    <span className="font-semibold tabular-nums" style={grade.value < 10 ? { color: 'var(--accent)' } : undefined}>
                                        {grade.value}/20
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
