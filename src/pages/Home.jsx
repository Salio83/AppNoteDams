import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, GraduationCap, AlertTriangle, Clock, ChevronRight, TrendingUp, BookOpen } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { calculateGlobalAverage, getUEStatistics } from '../utils/calculations';
import { getEventColor } from '../utils/colors';
import ues from '../../config_ue.json';

// Quick access button component
const QuickAccessButton = ({ to, icon: Icon, label, description, color }) => (
    <Link
        to={to}
        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all group"
    >
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 dark:text-white">{label}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
    </Link>
);

const Home = () => {
    const { user } = useAuth();
    const { events } = useSchedule();
    const [grades, setGrades] = useState([]);
    const [globalAverage, setGlobalAverage] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get today's courses
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

    // Get next day with courses
    const nextDayWithCourses = useMemo(() => {
        if (!events) return null;
        const now = new Date();
        now.setHours(23, 59, 59, 999); // End of today

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

        return {
            date: nextDate,
            courses: nextDayCourses
        };
    }, [events]);

    // Get next exam (DS)
    const nextExam = useMemo(() => {
        if (!events) return null;
        const now = new Date();

        const exams = events
            .filter(e => {
                const start = new Date(e.start);
                if (start <= now) return false;
                const summary = (e.summary || '').toLowerCase();
                const location = (e.location || '').toLowerCase();
                return summary.includes('ds') ||
                    summary.includes('exam') ||
                    summary.includes('contrôle') ||
                    location.includes('amphi');
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        return exams[0] || null;
    }, [events]);

    // Load grades
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
                const avg = calculateGlobalAverage(gradesData, ues);
                setGlobalAverage(avg);
            } catch (error) {
                console.error('Erreur chargement:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Get UE name by id
    const getUEName = (ueId) => {
        for (const ue of ues) {
            if (ue.id === ueId) return ue.nom;
            for (const mat of ue.matieres || []) {
                if (mat.id === ueId) return mat.nom;
            }
        }
        return 'Inconnu';
    };

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">Bonjour 👋</h1>
                <p className="text-slate-500 dark:text-slate-400">Voici un aperçu de votre journée</p>
            </header>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Moyenne Générale - Link to grades */}
                <Link
                    to="/grades"
                    className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-xl text-white hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Moyenne Générale</span>
                    </div>
                    <p className="text-3xl font-bold">
                        {globalAverage !== null ? `${globalAverage.toFixed(2)}/20` : '—'}
                    </p>
                    <p className="text-xs opacity-70 mt-1">Voir détails →</p>
                </Link>

                {/* Prochain examen - Link to exams with more info */}
                <Link
                    to="/exams"
                    className="col-span-2 lg:col-span-1 bg-gradient-to-br from-rose-500 to-rose-600 p-5 rounded-xl text-white hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Prochain DS</span>
                    </div>
                    {nextExam ? (
                        <>
                            <p className="font-bold truncate">{nextExam.summary || nextExam.title}</p>
                            <p className="text-sm opacity-80">{formatDate(nextExam.start)} • {formatTime(nextExam.start)}</p>
                            {nextExam.location && (
                                <p className="text-xs opacity-70 mt-1 truncate">📍 {nextExam.location}</p>
                            )}
                            <p className="text-xs font-semibold mt-2 bg-white/20 rounded px-2 py-1 inline-block">
                                J-{Math.ceil((new Date(nextExam.start) - new Date()) / (1000 * 60 * 60 * 24))}
                            </p>
                        </>
                    ) : (
                        <p className="opacity-80">Aucun DS prévu</p>
                    )}
                </Link>

                {/* Cours aujourd'hui - Link to schedule */}
                <Link
                    to="/schedule"
                    className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cours</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{displayCourses.length}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{displayDate ? formatDate(displayDate) : 'Aucun'}</p>
                </Link>

                {/* Dernières notes - Link to grades */}
                <Link
                    to="/grades"
                    className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Notes</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{grades.length}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">enregistrées</p>
                </Link>
            </div>

            {/* Prochaine journée de cours */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        <h2 className="font-semibold text-slate-800 dark:text-white">
                            {displayDate ? formatDate(displayDate) : 'Prochains cours'}
                        </h2>
                    </div>
                    <Link to="/schedule" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                        Voir tout <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {displayCourses.length === 0 ? (
                        <p className="p-4 text-slate-500 dark:text-slate-400 text-center">Aucun cours prévu</p>
                    ) : (
                        displayCourses.slice(0, 4).map((course, idx) => {
                            const colors = getEventColor(course.title || course.summary);
                            return (
                                <Link
                                    key={idx}
                                    to="/schedule"
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                >
                                    <div className={`w-1 h-12 rounded-full`} style={{ backgroundColor: colors.border.includes('blue') ? '#3B82F6' : colors.border.includes('green') ? '#10B981' : colors.border.includes('amber') ? '#F59E0B' : colors.border.includes('rose') ? '#F43F5E' : '#6366F1' }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-white truncate">{course.title || course.summary}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{course.location || 'Salle non précisée'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-semibold text-slate-800 dark:text-white">{formatTime(course.start)}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{formatTime(course.end)}</p>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Dernières notes */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-emerald-500" />
                        <h2 className="font-semibold text-slate-800 dark:text-white">Dernières notes</h2>
                    </div>
                    <Link to="/grades" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                        Gérer <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {grades.length === 0 ? (
                        <p className="p-4 text-slate-500 dark:text-slate-400 text-center">Aucune note enregistrée</p>
                    ) : (
                        grades.slice(0, 3).map((grade, idx) => (
                            <Link
                                key={grade.id || idx}
                                to="/grades"
                                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                            >
                                <span className="text-slate-700 dark:text-slate-300">{getUEName(grade.ue_id)}</span>
                                <span className={`font-bold ${grade.value >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                    {grade.value}/20
                                </span>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Access Buttons */}
            <div className="space-y-3">
                <h2 className="font-semibold text-slate-800 dark:text-white">Accès rapide</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <QuickAccessButton
                        to="/schedule"
                        icon={Calendar}
                        label="Emploi du temps"
                        description="Voir votre planning complet"
                        color="bg-indigo-500"
                    />
                    <QuickAccessButton
                        to="/grades"
                        icon={GraduationCap}
                        label="Notes & Moyennes"
                        description="Gérer vos notes et voir vos moyennes"
                        color="bg-emerald-500"
                    />
                    <QuickAccessButton
                        to="/exams"
                        icon={AlertTriangle}
                        label="Examens"
                        description="Voir les prochains DS et contrôles"
                        color="bg-rose-500"
                    />
                    <QuickAccessButton
                        to="/hours"
                        icon={Clock}
                        label="Heures restantes"
                        description="Suivre vos heures de cours"
                        color="bg-amber-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
