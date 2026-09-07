import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getEventColor } from '../../shared/utils/colors';
import { useSchedule } from '../../shared/context/ScheduleContext';
import { isExamEvent } from '../../shared/utils/scheduleAnalysis';
import { ScheduleSetupGuide } from '../../shared/components/SetupGuide';

const WEEK_DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
const WEEK_DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 08:00 .. 17:00
const WINDOW_START = 8;
const WINDOW_END = 18; // la ligne "17:00" couvre 17:00-18:00
const ROW_HEIGHT = 56;
const GRID_HEIGHT = (WINDOW_END - WINDOW_START) * ROW_HEIGHT; // 560
const MIN_GAP_INLINE_H = 3; // seuil d'affichage du label "Libre" dans la grille
const MIN_GAP_LIST_H = 1; // seuil d'affichage dans "Trous de la semaine"

const formatDurationShort = (hours) => {
    const rounded = Math.round(hours * 2) / 2;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} h`;
};

const formatHM = (hourDecimal) => {
    const h = Math.floor(hourDecimal);
    const m = Math.round((hourDecimal - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getEventStyle = (event) => {
    if (isExamEvent(event)) {
        return { bg: 'var(--t4-bg)', ink: 'var(--t4-ink)' };
    }
    return getEventColor(event.title);
};

// Fusionne les intervalles occupés d'une journée, bornés à la fenêtre affichée
const computeBusyIntervals = (dayEvents) => {
    const intervals = dayEvents
        .map(e => {
            const s = Math.max(e.start.getHours() + e.start.getMinutes() / 60, WINDOW_START);
            const en = Math.min(e.end.getHours() + e.end.getMinutes() / 60, WINDOW_END);
            return [s, en];
        })
        .filter(([s, en]) => en > s)
        .sort((a, b) => a[0] - b[0]);

    const merged = [];
    for (const [s, en] of intervals) {
        const last = merged[merged.length - 1];
        if (last && s <= last[1]) {
            last[1] = Math.max(last[1], en);
        } else {
            merged.push([s, en]);
        }
    }
    return merged;
};

const computeGaps = (dayEvents) => {
    const busy = computeBusyIntervals(dayEvents);
    const gaps = [];
    let cursor = WINDOW_START;
    for (const [s, en] of busy) {
        if (s > cursor) gaps.push([cursor, s]);
        cursor = Math.max(cursor, en);
    }
    if (cursor < WINDOW_END) gaps.push([cursor, WINDOW_END]);
    return gaps;
};

const formatGapLabel = (dayName, [s, en]) => {
    const duration = en - s;
    if (s <= 12 && en >= WINDOW_END) {
        return `${dayName} après-midi · ${formatDurationShort(duration)}`;
    }
    return `${dayName} ${formatHM(s)} — ${formatHM(en)} · ${formatDurationShort(duration)}`;
};

const eventsOverlap = (a, b) => a.start < b.end && a.end > b.start;

// Calcule les colonnes pour les événements qui se chevauchent dans une journée
const calculateEventColumns = (events) => {
    if (events.length === 0) return [];
    const sorted = [...events].sort((a, b) => a.start - b.start);
    const result = sorted.map(e => ({ ...e, column: 0, totalColumns: 1 }));

    for (let i = 0; i < result.length; i++) {
        const overlapping = result.filter((e, j) => j !== i && eventsOverlap(result[i], e));
        if (overlapping.length > 0) {
            const usedColumns = overlapping.map(e => e.column);
            let col = 0;
            while (usedColumns.includes(col)) col++;
            result[i].column = col;
        }
    }
    for (let i = 0; i < result.length; i++) {
        const overlapping = result.filter(e => eventsOverlap(result[i], e));
        const maxColumn = Math.max(...overlapping.map(e => e.column)) + 1;
        overlapping.forEach(e => { e.totalColumns = Math.max(e.totalColumns, maxColumn); });
    }
    return result;
};

const DayColumn = ({ label, isToday, dayEvents }) => {
    const processed = useMemo(() => calculateEventColumns(dayEvents), [dayEvents]);
    const gaps = useMemo(() => computeGaps(dayEvents), [dayEvents]);

    return (
        <div className="flex flex-col" style={{ flex: '1 1 0', minWidth: 130 }}>
            <div className="text-center text-[13px] h-8 flex items-center justify-center" style={{ fontWeight: isToday ? 700 : 400 }}>
                {label}
            </div>
            <div
                className="relative"
                style={{
                    height: GRID_HEIGHT,
                    borderLeft: '1px solid var(--rule)',
                    backgroundImage: 'repeating-linear-gradient(to bottom, var(--rule) 0 1px, transparent 1px 56px)'
                }}
            >
                {gaps.filter(([s, en]) => en - s >= MIN_GAP_INLINE_H).map(([s, en], i) => (
                    <div
                        key={`gap-${i}`}
                        className="absolute inset-x-0 flex items-center justify-center text-[11px] uppercase text-muted pointer-events-none"
                        style={{ top: (s - WINDOW_START) * ROW_HEIGHT, height: (en - s) * ROW_HEIGHT }}
                    >
                        Libre · {formatDurationShort(en - s)}
                    </div>
                ))}

                {processed.map((evt, idx) => {
                    const style = getEventStyle(evt);
                    const startH = evt.start.getHours() + evt.start.getMinutes() / 60;
                    const endH = evt.end.getHours() + evt.end.getMinutes() / 60;
                    const top = (startH - WINDOW_START) * ROW_HEIGHT;
                    const height = Math.max((endH - startH) * ROW_HEIGHT - 4, 24);
                    const width = 100 / evt.totalColumns;
                    const left = evt.column * width;

                    return (
                        <div
                            key={idx}
                            className="absolute rounded-[14px] overflow-hidden"
                            style={{
                                top,
                                left: `calc(${left}% + 4px)`,
                                width: `calc(${width}% - 8px)`,
                                height,
                                background: style.bg,
                                color: style.ink,
                                padding: '8px 10px'
                            }}
                        >
                            <div className="text-[13px] font-semibold leading-tight truncate">{evt.title}</div>
                            <div className="text-[11px] opacity-80 tabular-nums truncate">
                                {evt.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                {' – '}
                                {evt.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {evt.location && <div className="text-[11px] opacity-80 truncate">{evt.location}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Schedule = () => {
    const [searchParams] = useSearchParams();
    const { events, loading, error, refreshData, scheduleUrl } = useSchedule();

    const [currentDate, setCurrentDate] = useState(() => {
        const dateParam = searchParams.get('date');
        return dateParam ? new Date(dateParam) : new Date();
    });
    const [viewMode, setViewMode] = useState('week'); // 'week' | 'day'
    const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
        const today = new Date().getDay();
        return today >= 1 && today <= 5 ? today - 1 : 0;
    });

    const parsedEvents = useMemo(() => events.map(e => ({
        ...e,
        start: e.start instanceof Date ? e.start : new Date(e.start),
        end: e.end instanceof Date ? e.end : new Date(e.end)
    })), [events]);

    useEffect(() => {
        if (events.length === 0 && !loading && !error) {
            refreshData();
        }
    }, [events, loading, error, refreshData]);

    useEffect(() => {
        if (parsedEvents.length > 0 && searchParams.get('date')) {
            const targetDate = new Date(searchParams.get('date'));
            const diff = targetDate.getTime() - currentDate.getTime();
            if (Math.abs(diff) > 7 * 24 * 3600 * 1000) {
                setCurrentDate(targetDate);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parsedEvents, searchParams]);

    const getWeekRange = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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

    const currentWeekEvents = parsedEvents.filter(e => e.start >= weekStart && e.end <= weekEnd);

    const eventsByWeekday = Array.from({ length: 5 }, (_, i) => {
        return currentWeekEvents.filter(e => (e.start.getDay() === 0 ? 6 : e.start.getDay() - 1) === i);
    });

    const totalHours = eventsByWeekday.flat().reduce((sum, e) => sum + (e.end - e.start) / (1000 * 60 * 60), 0);

    const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
        ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('fr-FR', { month: 'long' })}`
        : `${weekStart.getDate()} ${weekStart.toLocaleDateString('fr-FR', { month: 'long' })} – ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('fr-FR', { month: 'long' })}`;

    const weekGaps = eventsByWeekday
        .map((dayEvents, i) => computeGaps(dayEvents)
            .filter(([s, en]) => en - s >= MIN_GAP_LIST_H)
            .map(gap => formatGapLabel(WEEK_DAYS_FULL[i], gap)))
        .flat();

    if (!loading && !error && events.length === 0 && !scheduleUrl) {
        return (
            <div className="space-y-6">
                <header>
                    <h2 className="font-display text-2xl">Emploi du temps</h2>
                    <p className="text-muted">Synchronisez votre planning pour le visualiser ici</p>
                </header>
                <ScheduleSetupGuide />
            </div>
        );
    }

    const daysToShow = viewMode === 'week' ? [0, 1, 2, 3, 4] : [selectedDayIndex];

    return (
        <div className="space-y-4">
            <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div>
                    <h2 className="font-display text-2xl">Emploi du temps</h2>
                    <p className="text-muted text-sm mt-1">
                        {weekLabel} · {formatDurationShort(totalHours)} de cours
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <button onClick={handlePrevWeek} className="whitespace-nowrap opacity-70 hover:opacity-100">
                        Semaine précédente
                    </button>
                    <button onClick={handleNextWeek} className="whitespace-nowrap opacity-70 hover:opacity-100">
                        Semaine suivante
                    </button>
                    <span className="whitespace-nowrap">
                        <button
                            onClick={() => setViewMode('day')}
                            style={{ fontWeight: viewMode === 'day' ? 700 : 400 }}
                            className={viewMode === 'day' ? '' : 'opacity-70 hover:opacity-100'}
                        >
                            Jour
                        </button>
                        {' / '}
                        <button
                            onClick={() => setViewMode('week')}
                            style={{ fontWeight: viewMode === 'week' ? 700 : 400 }}
                            className={viewMode === 'week' ? '' : 'opacity-70 hover:opacity-100'}
                        >
                            Semaine
                        </button>
                    </span>
                </div>
            </header>

            {viewMode === 'day' && (
                <div className="flex flex-wrap gap-4 text-sm">
                    {WEEK_DAYS_SHORT.map((d, i) => (
                        <button
                            key={d}
                            onClick={() => setSelectedDayIndex(i)}
                            style={{ fontWeight: selectedDayIndex === i ? 700 : 400 }}
                            className={selectedDayIndex === i ? '' : 'opacity-55 hover:opacity-100'}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            )}

            {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}

            <div className="rounded-[28px] bg-surface overflow-x-auto">
                <div
                    className="flex"
                    style={{ minWidth: viewMode === 'week' ? 760 : 200, padding: '12px 16px 16px' }}
                >
                    <div style={{ width: 54, flexShrink: 0 }}>
                        <div className="h-8" />
                        <div className="relative" style={{ height: GRID_HEIGHT }}>
                            {HOURS.map((h, i) => (
                                <div
                                    key={h}
                                    className="absolute right-2 text-[11px] text-muted"
                                    style={{ top: i * ROW_HEIGHT - 6 }}
                                >
                                    {String(h).padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>
                    </div>

                    {daysToShow.map(i => {
                        const dayDate = new Date(weekStart);
                        dayDate.setDate(weekStart.getDate() + i);
                        const isToday = new Date().toDateString() === dayDate.toDateString();
                        return (
                            <DayColumn
                                key={i}
                                label={`${WEEK_DAYS_SHORT[i]} ${dayDate.getDate()}`}
                                isToday={isToday}
                                dayEvents={eventsByWeekday[i]}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="text-[13px] text-muted space-y-1">
                <p>Trous de la semaine</p>
                {weekGaps.length === 0 ? (
                    <p>Aucun trou notable cette semaine.</p>
                ) : (
                    weekGaps.map((label, i) => <p key={i}>{label}</p>)
                )}
            </div>
        </div>
    );
};

export default Schedule;
