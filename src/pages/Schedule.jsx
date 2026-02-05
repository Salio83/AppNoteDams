import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, AlertCircle, CalendarDays, ClipboardList, Clock, Filter, X, Info } from 'lucide-react';
import { getEventColor } from '../utils/colors';
import { useSchedule } from '../context/ScheduleContext';
import { isExamEvent } from '../utils/scheduleAnalysis';

const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

// Helper function to get event colors with exam override
const getEventColors = (event) => {
    if (isExamEvent(event)) {
        return {
            bg: 'bg-red-500 dark:bg-red-600',
            border: 'border-red-600 dark:border-red-500',
            text: 'text-white'
        };
    }
    return getEventColor(event.title);
};

const Schedule = () => {
    const [searchParams] = useSearchParams();
    // Utiliser le contexte pour les données de l'emploi du temps
    const { events, loading, error, lastUpdated, refreshData, getCacheAge } = useSchedule();

    const [currentDate, setCurrentDate] = useState(() => {
        // Si une date est passée en paramètre, l'utiliser
        const dateParam = searchParams.get('date');
        return dateParam ? new Date(dateParam) : new Date();
    });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filter, setFilter] = useState(''); // Filter by subject
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Convertir les dates string en objets Date si nécessaire (depuis le cache)
    const parsedEvents = useMemo(() => {
        return events.map(e => ({
            ...e,
            start: e.start instanceof Date ? e.start : new Date(e.start),
            end: e.end instanceof Date ? e.end : new Date(e.end)
        }));
    }, [events]);

    // Extract unique subjects from events for filter dropdown
    const subjects = useMemo(() => {
        const uniqueSubjects = new Set();
        parsedEvents.forEach(e => {
            if (e.title) {
                // Extract base subject name (before any specific suffixes)
                const subject = e.title.split(' - ')[0].split(' (')[0].trim();
                if (subject) uniqueSubjects.add(subject);
            }
        });
        return Array.from(uniqueSubjects).sort();
    }, [parsedEvents]);

    // Charger les données au démarrage si pas encore chargées
    useEffect(() => {
        if (events.length === 0 && !loading && !error) {
            refreshData();
        }
    }, [events, loading, error, refreshData]);

    // Gérer la navigation vers la bonne semaine via URL (sans ouvrir de popup)
    useEffect(() => {
        if (parsedEvents.length > 0 && searchParams.get('date')) {
            const targetDate = new Date(searchParams.get('date'));
            // S'assurer que la vue est centrée sur cette semaine
            const diff = targetDate.getTime() - currentDate.getTime();
            if (Math.abs(diff) > 7 * 24 * 3600 * 1000) {
                setCurrentDate(targetDate);
            }
        }
    }, [parsedEvents, searchParams]);

    // Helper to get start/end of the viewed week
    const getWeekRange = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { start: monday, end: sunday };
    };

    const { start: weekStart, end: weekEnd } = getWeekRange(currentDate);

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Apply filter to week events
    const currentWeekEvents = parsedEvents.filter(e => {
        const inWeek = e.start >= weekStart && e.end <= weekEnd;
        if (!inWeek) return false;
        if (!filter) return true;
        return e.title && e.title.toLowerCase().includes(filter.toLowerCase());
    });

    // Détection des chevauchements entre événements
    const eventsOverlap = (a, b) => {
        return a.start < b.end && a.end > b.start;
    };

    // Calcule les colonnes pour les événements qui se chevauchent
    const calculateEventColumns = (events) => {
        if (events.length === 0) return [];

        // Trier par heure de début
        const sorted = [...events].sort((a, b) => a.start - b.start);
        const result = sorted.map(e => ({ ...e, column: 0, totalColumns: 1 }));

        // Trouver les groupes d'événements qui se chevauchent
        for (let i = 0; i < result.length; i++) {
            // Trouver tous les événements qui chevauchent l'événement actuel
            const overlapping = result.filter((e, j) => j !== i && eventsOverlap(result[i], e));

            if (overlapping.length > 0) {
                // Collecter toutes les colonnes utilisées par les événements chevauchants
                const usedColumns = overlapping.map(e => e.column);

                // Trouver la première colonne disponible
                let col = 0;
                while (usedColumns.includes(col)) {
                    col++;
                }
                result[i].column = col;
            }
        }

        // Calculer le nombre total de colonnes pour chaque groupe
        for (let i = 0; i < result.length; i++) {
            const overlapping = result.filter(e => eventsOverlap(result[i], e));
            const maxColumn = Math.max(...overlapping.map(e => e.column)) + 1;
            overlapping.forEach(e => {
                e.totalColumns = Math.max(e.totalColumns, maxColumn);
            });
        }

        return result;
    };

    // Group events by day index (0 = Mon, 6 = Sun)
    const eventsByDay = Array.from({ length: 7 }, () => []);
    currentWeekEvents.forEach(e => {
        let dayIndex = e.start.getDay() - 1;
        if (dayIndex === -1) dayIndex = 6;
        if (dayIndex >= 0 && dayIndex <= 6) {
            eventsByDay[dayIndex].push(e);
        }
    });

    // Appliquer le calcul des colonnes à chaque jour
    const processedEventsByDay = eventsByDay.map(dayEvents => calculateEventColumns(dayEvents));

    return (
        <div className="space-y-2 lg:space-y-4 h-[calc(100vh-6rem)] lg:h-[calc(100vh-6rem)] flex flex-col">
            {/* Mobile Shortcuts - masqués pour gagner de l'espace */}
            <div className="hidden md:grid grid-cols-3 gap-3">
                <Link to="/calendar" className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <CalendarDays className="w-5 h-5 text-indigo-500 mb-1" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Calendrier</span>
                </Link>
                <Link to="/tasks" className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <ClipboardList className="w-5 h-5 text-emerald-500 mb-1" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Tâches</span>
                </Link>
                <Link to="/hours" className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <Clock className="w-5 h-5 text-amber-500 mb-1" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Heures</span>
                </Link>
            </div>

            <header className="flex flex-row justify-between items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
                    <h2 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-white">Emploi du temps</h2>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button onClick={handlePrevWeek} className="p-1 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all text-slate-600 dark:text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <button onClick={handleToday} className="px-2 lg:px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all">
                            {weekStart.getDate()} - {weekEnd.getDate()} {weekEnd.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                        </button>
                        <button onClick={handleNextWeek} className="p-1 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all text-slate-600 dark:text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize hidden lg:block">
                        {weekStart.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })} - {weekEnd.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${filter ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            title="Filtrer par matière"
                        >
                            <Filter className="w-5 h-5" />
                            {filter && <span className="hidden lg:inline text-xs font-medium truncate max-w-[80px]">{filter}</span>}
                        </button>

                        {showFilterDropdown && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowFilterDropdown(false)} />
                                <div className="absolute right-0 top-full mt-2 z-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 w-64 max-h-64 overflow-y-auto animate-slideUp">
                                    {filter && (
                                        <button
                                            onClick={() => { setFilter(''); setShowFilterDropdown(false); }}
                                            className="w-full px-4 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Effacer le filtre
                                        </button>
                                    )}
                                    {subjects.map(subject => (
                                        <button
                                            key={subject}
                                            onClick={() => { setFilter(subject); setShowFilterDropdown(false); }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${filter === subject ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                                        >
                                            {subject}
                                        </button>
                                    ))}
                                    {subjects.length === 0 && (
                                        <p className="px-4 py-2 text-sm text-slate-400 dark:text-slate-500">Aucune matière trouvée</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {lastUpdated && (
                        <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                            <Info className="w-3 h-3" />
                            <span>Cache: {getCacheAge()}</span>
                        </div>
                    )}

                    <button
                        onClick={() => refreshData(true)}
                        disabled={loading}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 shrink-0"
                        title="Actualiser l'emploi du temps"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-lg flex items-center gap-2 text-sm shrink-0 border border-rose-100 dark:border-rose-800">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Mobile Day View */}
            <MobileDayView
                weekStart={weekStart}
                processedEventsByDay={processedEventsByDay}
                initialDate={currentDate}
            />

            {/* Desktop Week Grid */}
            <div className="hidden lg:flex flex-1 overflow-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 min-h-0">
                <div className="grid grid-cols-[auto_repeat(5,1fr)] w-full">
                    {/* Header Row */}
                    <div className="border-b border-slate-100 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10"></div>
                    {WEEK_DAYS.map((day, index) => {
                        const currentDayDate = new Date(weekStart);
                        currentDayDate.setDate(weekStart.getDate() + index);
                        const isToday = new Date().toDateString() === currentDayDate.toDateString();

                        return (
                            <div key={day} className={`border-b border-l border-slate-100 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 text-center ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                                <div className={`text-sm font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{day}</div>
                                <div className={`text-xs ${isToday ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {currentDayDate.getDate()}
                                </div>
                            </div>
                        );
                    })}

                    {/* Time Slots */}
                    {HOURS.map(hour => (
                        <React.Fragment key={hour}>
                            <div className="border-b border-slate-100 dark:border-slate-700 p-1 text-[10px] text-slate-400 dark:text-slate-500 text-right h-12 -mt-2">
                                {hour}:00
                            </div>
                            {Array.from({ length: 5 }).map((_, dayIndex) => {
                                // Trouver les événements qui commencent dans cette heure
                                const hourEvents = processedEventsByDay[dayIndex].filter(e => e.start.getHours() === hour);

                                return (
                                    <div key={dayIndex} className="border-b border-l border-slate-100 dark:border-slate-700 h-12 relative bg-slate-50/10 dark:bg-slate-800/50 hover:bg-slate-50/30 dark:hover:bg-slate-700/50 transition-colors">
                                        {hourEvents.map((evt, idx) => {
                                            const colors = getEventColors(evt);

                                            // Calculer le décalage vertical basé sur les minutes
                                            const startMinutes = evt.start.getMinutes();
                                            const topOffset = (startMinutes / 60) * 100; // en pourcentage de la cellule d'heure

                                            // Calculer la largeur et position horizontale basées sur les colonnes
                                            const width = 100 / evt.totalColumns;
                                            const left = evt.column * width;

                                            // Calculer la hauteur basée sur la durée
                                            const durationHours = (evt.end - evt.start) / (1000 * 60 * 60);
                                            const height = durationHours * 100; // en pourcentage (100% = 1 heure)

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedEvent(evt)}
                                                    className={`absolute ${colors.bg} border ${colors.border} ${colors.text} rounded-lg p-1.5 text-xs overflow-hidden hover:z-20 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group flex flex-col`}
                                                    title={`${evt.title}\n${evt.location}`}
                                                    style={{
                                                        top: `calc(${topOffset}% + 2px)`,
                                                        left: `calc(${left}% + 2px)`,
                                                        width: `calc(${width}% - 4px)`,
                                                        height: `calc(${height}% - 4px)`,
                                                        minHeight: '2rem',
                                                        zIndex: 1
                                                    }}
                                                >
                                                    <div className="font-bold truncate group-hover:whitespace-normal leading-tight mb-0.5">{evt.title}</div>
                                                    <div className="truncate opacity-75 text-[10px]">{evt.location}</div>
                                                    <div className="truncate opacity-75 text-[10px] mt-auto">{evt.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Event Detail Modal (Desktop) */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`p-4 ${getEventColors(selectedEvent).bg} ${getEventColors(selectedEvent).border} border-b`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className={`font-bold text-lg ${getEventColors(selectedEvent).text}`}>
                                        {selectedEvent.title}
                                    </h3>
                                    <p className={`text-sm opacity-80 ${getEventColors(selectedEvent).text}`}>
                                        {selectedEvent.start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-2 hover:bg-white/30 dark:hover:bg-black/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Horaires */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {selectedEvent.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {selectedEvent.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Durée: {Math.floor((selectedEvent.end - selectedEvent.start) / (1000 * 60 * 60))}h{((selectedEvent.end - selectedEvent.start) / (1000 * 60)) % 60 > 0 ? `${((selectedEvent.end - selectedEvent.start) / (1000 * 60)) % 60}min` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Lieu */}
                            {selectedEvent.location && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">Salle</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedEvent.location}</p>
                                    </div>
                                </div>
                            )}

                            {/* Description / Prof */}
                            {selectedEvent.description && (
                                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">Informations</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words">{selectedEvent.description}</p>
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

// Mobile Day View Component
const MobileDayView = ({ weekStart, processedEventsByDay, initialDate }) => {
    const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
        // Si une date initiale est fournie (redirection depuis un examen), l'utiliser
        if (initialDate) {
            const dayOfWeek = initialDate.getDay();
            // Convertir: dimanche=0 -> -1, lundi=1 -> 0, etc.
            const index = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek - 1 : 0;
            return index;
        }
        // Sinon, utiliser aujourd'hui si c'est un jour de semaine
        const today = new Date().getDay();
        return today >= 1 && today <= 5 ? today - 1 : 0;
    });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [viewMode, setViewMode] = useState('day'); // 'day' or 'week'

    // Mettre à jour le jour sélectionné quand initialDate change (navigation depuis un examen)
    useEffect(() => {
        if (initialDate) {
            const dayOfWeek = initialDate.getDay();
            const index = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek - 1 : 0;
            setSelectedDayIndex(index);
        }
    }, [initialDate]);

    const MOBILE_WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];

    const getDayDate = (index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
    };

    const dayEvents = processedEventsByDay[selectedDayIndex] || [];
    const sortedEvents = [...dayEvents].sort((a, b) => a.start - b.start);

    // Extraire les infos du prof depuis la description
    const extractProfessor = (description) => {
        if (!description) return null;
        // Chercher le pattern courant dans les descriptions iCal
        const lines = description.split('\n');
        for (const line of lines) {
            if (line.toLowerCase().includes('prof') || line.toLowerCase().includes('enseignant')) {
                return line.replace(/^[^:]+:\s*/, '').trim();
            }
        }
        // Sinon retourner la première ligne non vide comme fallback
        return lines.find(l => l.trim().length > 0) || null;
    };

    return (
        <div className="lg:hidden flex-1 flex flex-col min-h-0">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('day')}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'day'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        Jour
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'week'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        Semaine
                    </button>
                </div>
            </div>

            {/* Day Selector Tabs - Only show in day mode */}
            {viewMode === 'day' && (
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-2 shrink-0">
                    {MOBILE_WEEK_DAYS.map((day, index) => {
                        const dayDate = getDayDate(index);
                        const isToday = new Date().toDateString() === dayDate.toDateString();
                        const isSelected = selectedDayIndex === index;
                        const hasEvents = processedEventsByDay[index]?.length > 0;

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDayIndex(index)}
                                className={`flex-1 py-2 px-1 rounded-lg text-center transition-all relative ${isSelected
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                                    : isToday
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                <div className={`text-xs font-semibold ${isSelected ? 'text-slate-900 dark:text-white' : ''}`}>{day}</div>
                                <div className={`text-lg font-bold ${isToday && !isSelected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                    {dayDate.getDate()}
                                </div>
                                {hasEvents && (
                                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-500'
                                        }`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Events List for Selected Day - Day Mode */}
            {viewMode === 'day' && (
                <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                    {sortedEvents.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center border border-slate-200/60 dark:border-slate-700">
                            <div className="text-slate-400 dark:text-slate-500 text-sm">Aucun cours ce jour</div>
                        </div>
                    ) : (
                        sortedEvents.map((evt, idx) => {
                            const colors = getEventColors(evt);
                            const startTime = evt.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            const endTime = evt.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            const durationMinutes = (evt.end - evt.start) / (1000 * 60);
                            const durationHours = Math.floor(durationMinutes / 60);
                            const durationMins = durationMinutes % 60;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedEvent(evt)}
                                    className={`${colors.bg} border ${colors.border} rounded-xl p-4 ${colors.text} cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-base leading-snug mb-1">{evt.title}</h3>
                                            {evt.location && (
                                                <p className="text-sm opacity-80 mb-2">📍 {evt.location}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-semibold text-sm">{startTime}</div>
                                            <div className="text-xs opacity-70">{endTime}</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-xs opacity-70">
                                        <span>
                                            Durée: {durationHours > 0 ? `${durationHours}h` : ''}{durationMins > 0 ? `${durationMins}min` : ''}
                                        </span>
                                        <span className="text-[10px] opacity-60">Appuyez pour détails →</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Week View - Week Mode */}
            {viewMode === 'week' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Week Grid - 5 columns */}
                    <div className="grid grid-cols-5 gap-1.5 flex-1 min-h-0">
                        {MOBILE_WEEK_DAYS.map((day, dayIndex) => {
                            const dayDate = getDayDate(dayIndex);
                            const isToday = new Date().toDateString() === dayDate.toDateString();
                            const dayEvents = processedEventsByDay[dayIndex] || [];
                            const sortedDayEvents = [...dayEvents].sort((a, b) => a.start - b.start);

                            return (
                                <div key={day} className="flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 overflow-hidden">
                                    {/* Day Header */}
                                    <div className={`p-2 border-b border-slate-200/60 dark:border-slate-700 shrink-0 ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-900'}`}>
                                        <div className={`font-bold text-xs text-center ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {day.substring(0, 3)}
                                        </div>
                                        <div className={`text-sm font-bold text-center ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {dayDate.getDate()}
                                        </div>
                                    </div>

                                    {/* Day Events - Scrollable */}
                                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                                        {sortedDayEvents.length === 0 ? (
                                            <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs">
                                                Aucun cours
                                            </div>
                                        ) : (
                                            sortedDayEvents.map((evt, idx) => {
                                                const colors = getEventColors(evt);
                                                const startTime = evt.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                                const endTime = evt.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedEvent(evt)}
                                                        className={`${colors.bg} border ${colors.border} rounded-md p-2 ${colors.text} cursor-pointer active:scale-95 transition-all`}
                                                    >
                                                        <div className="text-[10px] font-bold leading-tight mb-1" style={{ wordBreak: 'break-word' }}>
                                                            {evt.title}
                                                        </div>
                                                        <div className="text-[9px] opacity-80 font-medium">
                                                            {startTime}
                                                        </div>
                                                        <div className="text-[8px] opacity-60 mt-0.5">
                                                            {endTime}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`p-4 ${getEventColors(selectedEvent).bg} ${getEventColors(selectedEvent).border} border-b`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className={`font-bold text-lg ${getEventColors(selectedEvent).text}`}>
                                        {selectedEvent.title}
                                    </h3>
                                    <p className={`text-sm opacity-80 ${getEventColors(selectedEvent).text}`}>
                                        {selectedEvent.start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-2 hover:bg-white/30 dark:hover:bg-black/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Horaires */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {selectedEvent.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {selectedEvent.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Durée: {Math.floor((selectedEvent.end - selectedEvent.start) / (1000 * 60 * 60))}h{((selectedEvent.end - selectedEvent.start) / (1000 * 60)) % 60 > 0 ? `${((selectedEvent.end - selectedEvent.start) / (1000 * 60)) % 60}min` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Lieu */}
                            {selectedEvent.location && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">Salle</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedEvent.location}</p>
                                    </div>
                                </div>
                            )}

                            {/* Description / Prof */}
                            {selectedEvent.description && (
                                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">Informations</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words">{selectedEvent.description}</p>
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

export default Schedule;
