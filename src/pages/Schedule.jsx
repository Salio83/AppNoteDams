import React, { useState, useEffect } from 'react';
import ICAL from 'ical.js';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { getEventColor } from '../utils/colors';

const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

const Schedule = () => {
    // Default URL pointing to the proxy path if needed, but user might paste full URL.
    const [url, setUrl] = useState(localStorage.getItem('schedule_url') || 'https://proseconsult.umontpellier.fr/jsp/custom/modules/plannings/direct_cal.jsp?data=58c99062bab31d256bee14356aca3f2423c0f022cb9660eba051b2653be722c4255dc57febc36bcda019d951db547ac9dc5c094f7d1a811b903031bde802c7f52fd380b992d3771de6139e0d9278c8e91aa43e5f4eeaa642fb89a601c5d38bdb242c572c6bf1cac3537c3eed8f7cb4820cecc4c4c9f5d60f651b1c48c2fe7b06,1');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (url) {
            loadSchedule();
        }
    }, []); // Initial load only

    const loadSchedule = async () => {
        if (!url) return;
        setLoading(true);
        setError(null);
        localStorage.setItem('schedule_url', url);

        try {
            // Use proxy if dealing with the known university domain to avoid CORS
            let fetchUrl = url;
            if (url.includes('proseconsult.umontpellier.fr')) {
                // Remove the domain to make it a relative path, which Vite will proxy
                fetchUrl = url.replace(/https?:\/\/proseconsult\.umontpellier\.fr/, '');
            }

            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`Erreur ${response.status}: Impossible de récupérer le fichier`);

            const text = await response.text();
            parseICS(text);
        } catch (err) {
            console.error(err);
            setError(`Erreur: ${err.message}.`);
        } finally {
            setLoading(false);
        }
    };

    const parseICS = (icsData) => {
        try {
            const jcalData = ICAL.parse(icsData);
            const comp = new ICAL.Component(jcalData);
            const vevents = comp.getAllSubcomponents('vevent');

            const parsedEvents = vevents.map(vevent => {
                const event = new ICAL.Event(vevent);
                return {
                    title: event.summary,
                    start: event.startDate.toJSDate(),
                    end: event.endDate.toJSDate(),
                    location: event.location,
                    description: event.description
                };
            });

            setEvents(parsedEvents);
        } catch (err) {
            console.error(err);
            setError("Format iCal invalide.");
        }
    };

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

    const currentWeekEvents = events.filter(e => e.start >= weekStart && e.end <= weekEnd);

    // Group events by day index (0 = Mon, 6 = Sun)
    const eventsByDay = Array.from({ length: 7 }, () => []);
    currentWeekEvents.forEach(e => {
        let dayIndex = e.start.getDay() - 1;
        if (dayIndex === -1) dayIndex = 6;
        if (dayIndex >= 0 && dayIndex <= 6) {
            eventsByDay[dayIndex].push(e);
        }
    });

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Emploi du temps</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button onClick={handlePrevWeek} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <button onClick={handleToday} className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-sm rounded transition-all">
                                Aujourd'hui
                            </button>
                            <button onClick={handleNextWeek} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </button>
                        </div>
                        <p className="text-sm font-medium text-slate-500 capitalize">
                            {weekStart.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })} - {weekEnd.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 items-center w-full max-w-sm">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="URL .ics"
                        className="flex-1 rounded-lg border-gray-300 shadow-sm text-sm p-2 border"
                    />
                    <button
                        onClick={loadSchedule}
                        disabled={loading}
                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg flex items-center gap-2 text-sm shrink-0 border border-rose-100">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Schedule Grid */}
            <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-slate-200/60 min-h-0">
                <div className="grid grid-cols-[auto_repeat(7,1fr)] min-w-[800px]">
                    {/* Header Row */}
                    <div className="border-b border-slate-100 p-2 bg-slate-50 sticky top-0 z-10"></div>
                    {WEEK_DAYS.map((day, index) => {
                        const currentDayDate = new Date(weekStart);
                        currentDayDate.setDate(weekStart.getDate() + index);
                        const isToday = new Date().toDateString() === currentDayDate.toDateString();

                        return (
                            <div key={day} className={`border-b border-l border-slate-100 p-2 bg-slate-50 sticky top-0 z-10 text-center ${isToday ? 'bg-blue-50/50' : ''}`}>
                                <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{day}</div>
                                <div className={`text-xs ${isToday ? 'text-blue-500' : 'text-slate-400'}`}>
                                    {currentDayDate.getDate()}
                                </div>
                            </div>
                        );
                    })}

                    {/* Time Slots */}
                    {HOURS.map(hour => (
                        <React.Fragment key={hour}>
                            <div className="border-b border-slate-100 p-2 text-xs text-slate-400 text-right h-20 -mt-2.5">
                                {hour}:00
                            </div>
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                                return (
                                    <div key={dayIndex} className="border-b border-l border-slate-100 h-20 relative bg-slate-50/10 hover:bg-slate-50/30 transition-colors">
                                        {eventsByDay[dayIndex].filter(e => e.start.getHours() === hour).map((evt, idx) => {
                                            const colors = getEventColor(evt.title);
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`absolute top-1 left-1 right-1 bottom-1 ${colors.bg} border ${colors.border} ${colors.text} rounded-lg p-1.5 text-xs overflow-hidden hover:z-20 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group flex flex-col z-0`}
                                                    title={`${evt.title}\n${evt.location}`}
                                                    style={{
                                                        height: `calc(${(evt.end - evt.start) / (1000 * 60 * 60) * 100}% - 4px)`,
                                                        minHeight: '2rem'
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
        </div>
    );
};

export default Schedule;
