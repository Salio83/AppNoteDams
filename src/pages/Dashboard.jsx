import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Calendar, Bell, TrendingUp, GraduationCap, AlertTriangle } from 'lucide-react';
import DashboardStats from '../components/DashboardStats';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { calculateGlobalAverage, getUEStatistics } from '../utils/calculations';
import ues from '../../config_ue.json';

// Next course card component
const NextCourseCard = ({ event }) => {
    const navigate = useNavigate();

    if (!event) {
        return (
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 p-5 rounded-xl shadow-lg text-white">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Prochain cours</span>
                </div>
                <p className="text-lg font-semibold opacity-90">Aucun cours prévu</p>
            </div>
        );
    }

    const startTime = new Date(event.start);
    const now = new Date();
    const isToday = startTime.toDateString() === now.toDateString();
    const isTomorrow = startTime.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    const formatTime = (date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date) => date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div
            onClick={() => navigate('/')}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 p-5 rounded-xl shadow-lg text-white cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all"
        >
            <div className="flex items-center gap-2 mb-3 opacity-80">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Prochain cours</span>
            </div>
            <h3 className="text-lg font-bold mb-2 leading-tight">{event.summary}</h3>
            <div className="flex flex-wrap gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{isToday ? "Aujourd'hui" : isTomorrow ? "Demain" : formatDate(startTime)} • {formatTime(startTime)}</span>
                </div>
                {event.location && (
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Recent grades card
const RecentGradesCard = ({ grades }) => {
    const navigate = useNavigate();

    // Find UE name by id
    const getUEName = (ueId) => {
        for (const ue of ues) {
            if (ue.id === ueId) return ue.nom;
            for (const mat of ue.matieres || []) {
                if (mat.id === ueId) return mat.nom;
            }
        }
        return 'Inconnu';
    };

    if (!grades || grades.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Dernières notes</span>
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500">Aucune note enregistrée</p>
            </div>
        );
    }

    return (
        <div
            onClick={() => navigate('/grades')}
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Dernières notes</span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">Voir tout →</span>
            </div>
            <div className="space-y-2">
                {grades.slice(0, 3).map((grade, index) => (
                    <div key={grade.id || index} className="flex justify-between items-center py-1">
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate pr-2">{getUEName(grade.ue_id)}</span>
                        <span className={`text-sm font-bold ${grade.value >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                            {grade.value}/20
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Alerts card
const AlertsCard = ({ alerts }) => {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Alertes</span>
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500">Aucune alerte</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Alertes</span>
            </div>
            <div className="space-y-2">
                {alerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className="flex items-start gap-2 py-1">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 ${alert.type === 'warning' ? 'text-orange-500' : 'text-blue-500'}`} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{alert.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const { events } = useSchedule();
    const navigate = useNavigate();
    const [grades, setGrades] = useState([]);
    const [stats, setStats] = useState({
        globalAverage: null,
        bestSubject: null,
        ueStats: []
    });
    const [loading, setLoading] = useState(true);

    // Get next upcoming course
    const nextCourse = useMemo(() => {
        if (!events || events.length === 0) return null;
        const now = new Date();
        const upcoming = events
            .filter(e => new Date(e.start) > now)
            .sort((a, b) => new Date(a.start) - new Date(b.start));
        return upcoming[0] || null;
    }, [events]);

    // Generate alerts based on schedule
    const alerts = useMemo(() => {
        const alertList = [];
        if (!events) return alertList;

        const now = new Date();
        const todayEvents = events.filter(e => {
            const start = new Date(e.start);
            return start.toDateString() === now.toDateString();
        });

        if (todayEvents.length > 4) {
            alertList.push({ type: 'info', message: `Journée chargée : ${todayEvents.length} cours aujourd'hui` });
        }

        // Check for exams coming up
        const upcomingExams = events.filter(e => {
            const start = new Date(e.start);
            const daysUntil = (start - now) / (1000 * 60 * 60 * 24);
            const summary = (e.summary || '').toLowerCase();
            return daysUntil > 0 && daysUntil <= 7 && (summary.includes('ds') || summary.includes('exam') || summary.includes('contrôle'));
        });

        upcomingExams.forEach(exam => {
            const daysUntil = Math.ceil((new Date(exam.start) - now) / (1000 * 60 * 60 * 24));
            alertList.push({ type: 'warning', message: `Examen dans ${daysUntil} jour(s) : ${exam.summary}` });
        });

        return alertList;
    }, [events]);

    useEffect(() => {
        const loadStats = async () => {
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

                const globalAvg = calculateGlobalAverage(gradesData, ues);
                const ueStats = getUEStatistics(gradesData, ues);

                const activeUEs = ueStats.filter(u => u.average !== null);
                const bestSubject = activeUEs.length > 0
                    ? activeUEs.reduce((prev, current) => (prev.average > current.average) ? prev : current)
                    : null;

                setStats({
                    globalAverage: globalAvg,
                    bestSubject,
                    ueStats
                });
            } catch (error) {
                console.error('Erreur chargement stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [user]);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tableau de Bord</h2>
                <p className="text-slate-500 dark:text-slate-400">Aperçu de vos performances académiques</p>
            </header>

            {/* Quick Info Cards - Next course, Recent grades, Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NextCourseCard event={nextCourse} />
                <RecentGradesCard grades={grades} />
                <AlertsCard alerts={alerts} />
            </div>

            <DashboardStats
                globalAverage={stats.globalAverage}
                bestSubject={stats.bestSubject}
                ueStats={stats.ueStats}
            />
        </div>
    );
};

export default Dashboard;

