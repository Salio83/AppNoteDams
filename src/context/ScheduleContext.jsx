import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ICAL from 'ical.js';
import { detectExams, calculateHoursBySubject } from '../utils/scheduleAnalysis';
import ues from '../../config_ue.json';
import { api } from '../lib/api';

const ScheduleContext = createContext(null);

const CACHE_KEY = 'schedule_cache';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 heures en ms
const AUTO_REFRESH_INTERVAL = 2 * 60 * 60 * 1000; // Recharger toutes les 2 heures

/**
 * Provider pour gérer l'état global de l'emploi du temps
 * Les données sont chargées et cachées pendant 2h, avec rechargement automatique
 */
export const ScheduleProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [exams, setExams] = useState([]);
    const [hoursBySubject, setHoursBySubject] = useState({ S1: [], S2: [], all: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [scheduleUrl, setScheduleUrl] = useState('');

    // Initial Sync with Backend
    useEffect(() => {
        const syncWithBackend = async () => {
            try {
                const { scheduleUrl: backendUrl } = await api.get('/user/schedule');
                
                if (backendUrl) {
                    setScheduleUrl(backendUrl);
                    // On ne stocke plus dans localStorage, on utilise juste le state
                    // Si on a un cache mais pas de URL chargée, on verra au prochain refresh
                } else {
                    setScheduleUrl('');
                    localStorage.removeItem(CACHE_KEY);
                    setEvents([]);
                    setExams([]);
                    setHoursBySubject({ S1: [], S2: [], all: [] });
                    setLastUpdated(null);
                }
            } catch (e) {
                console.error("Failed to sync schedule URL", e);
            }
            
            loadInitialData();
        };

        syncWithBackend();
    }, []);

    const loadInitialData = () => {
        const loadFromCache = () => {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { events, exams, hoursBySubject, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;

                    if (age < CACHE_DURATION) {
                        setEvents(events);
                        setExams(exams);
                        setHoursBySubject(hoursBySubject);
                        setLastUpdated(new Date(timestamp));
                        return true;
                    }
                }
            } catch (e) {
                console.error('Erreur lecture cache:', e);
            }
            return false;
        };

        loadFromCache();
    };

    // Rechargement automatique toutes les 2 heures
    useEffect(() => {
        if (!scheduleUrl) return;

        const interval = setInterval(() => {
            console.log('[ScheduleContext] Rechargement automatique des données...');
            refreshData(true);
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [scheduleUrl]);

    // Fonction pour parser les événements iCal
    const parseEvents = (icsData) => {
        const jcalData = ICAL.parse(icsData);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        return vevents.map(vevent => {
            const event = new ICAL.Event(vevent);
            return {
                title: event.summary,
                start: event.startDate.toJSDate(),
                end: event.endDate.toJSDate(),
                location: event.location,
                description: event.description
            };
        });
    };

    // Fonction pour sauvegarder l'URL (Backend uniquement)
    const saveScheduleUrl = async (url) => {
        try {
            await api.post('/user/schedule', { scheduleUrl: url });
            setScheduleUrl(url);
            
            if (url) {
                // On force le refresh avec la nouvelle URL du state
                setTimeout(() => refreshData(true), 0);
            } else {
                localStorage.removeItem(CACHE_KEY);
                setEvents([]);
                setExams([]);
                setHoursBySubject({ S1: [], S2: [], all: [] });
            }
            return true;
        } catch (err) {
            console.error(err);
            setError("Impossible de sauvegarder l'URL: " + err.message);
            return false;
        }
    };

    // Fonction pour actualiser les données (appelée manuellement ou auto)
    const refreshData = useCallback(async (forceRefresh = false) => {
        // On utilise l'URL du state, plus celle du localStorage
        if (!scheduleUrl) {
            return;
        }

        // Vérifier si le cache est encore valide (sauf si forceRefresh)
        if (!forceRefresh) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return; // Cache encore valide
                }
            }
        }

        setLoading(true);
        setError(null);

        try {
            let fetchUrl = scheduleUrl;
            if (scheduleUrl.includes('proseconsult.umontpellier.fr')) {
                fetchUrl = scheduleUrl.replace(/https?:\/\/proseconsult\.umontpellier\.fr/, '');
                if (!fetchUrl.startsWith('/')) fetchUrl = '/' + fetchUrl;
            }

            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`Erreur ${response.status}`);

            const text = await response.text();
            const parsedEvents = parseEvents(text);

            const detectedExams = detectExams(parsedEvents);
            const hoursS1 = calculateHoursBySubject(parsedEvents, ues, 'S1');
            const hoursS2 = calculateHoursBySubject(parsedEvents, ues, 'S2');
            const hoursAll = calculateHoursBySubject(parsedEvents, ues, 'all');

            setEvents(parsedEvents);
            setExams(detectedExams);
            setHoursBySubject({ S1: hoursS1, S2: hoursS2, all: hoursAll });
            setLastUpdated(new Date());

            const cacheData = {
                events: parsedEvents,
                exams: detectedExams,
                hoursBySubject: { S1: hoursS1, S2: hoursS2, all: hoursAll },
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        } catch (err) {
            console.error(err);
            setError(`Erreur de chargement: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [scheduleUrl]);

    // Calculer le temps restant avant expiration du cache
    const getCacheAge = useCallback(() => {
        if (!lastUpdated) return null;
        const ageMs = Date.now() - lastUpdated.getTime();
        const remainingMs = CACHE_DURATION - ageMs;

        if (remainingMs <= 0) return 'Expiré';

        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}min`;
    }, [lastUpdated]);

    const value = {
        events,
        exams,
        hoursBySubject,
        loading,
        error,
        lastUpdated,
        scheduleUrl,
        refreshData,
        getCacheAge,
        saveScheduleUrl
    };

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
};

/**
 * Hook pour accéder aux données de l'emploi du temps
 */
export const useSchedule = () => {
    const context = useContext(ScheduleContext);
    if (!context) {
        throw new Error('useSchedule must be used within a ScheduleProvider');
    }
    return context;
};

export default ScheduleContext;
