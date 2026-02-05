import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ICAL from 'ical.js';
import { detectExams, calculateHoursBySubject } from '../utils/scheduleAnalysis';
import ues from '../../config_ue.json';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const ScheduleContext = createContext(null);

const AUTO_REFRESH_INTERVAL = 2 * 60 * 60 * 1000; // Recharger toutes les 2 heures

/**
 * Provider pour gérer l'état global de l'emploi du temps
 * Les données sont chargées depuis l'URL stockée en base de données
 */
export const ScheduleProvider = ({ children }) => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [exams, setExams] = useState([]);
    const [hoursBySubject, setHoursBySubject] = useState({ S1: [], S2: [], all: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [scheduleUrl, setScheduleUrl] = useState('');
    const [filiere, setFiliere] = useState('');
    const [annee, setAnnee] = useState('');

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

    // Fonction pour actualiser les données
    const refreshData = useCallback(async (urlOverride = null) => {
        const urlToFetch = urlOverride || scheduleUrl;
        
        if (!urlToFetch) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let fetchUrl = urlToFetch;
            if (urlToFetch.includes('proseconsult.umontpellier.fr')) {
                fetchUrl = urlToFetch.replace(/https?:\/\/proseconsult\.umontpellier\.fr/, '');
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

        } catch (err) {
            console.error(err);
            setError(`Erreur de chargement: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [scheduleUrl]);

    // Initial Sync with Backend & Cleanup legacy cache
    useEffect(() => {
        const syncWithBackend = async () => {
            if (!user) {
                setScheduleUrl('');
                setFiliere('');
                setAnnee('');
                setEvents([]);
                setExams([]);
                setHoursBySubject({ S1: [], S2: [], all: [] });
                setLastUpdated(null);
                return;
            }

            try {
                // Charger tous les paramètres utilisateur
                const settings = await api.get('/user/settings');
                
                if (settings.scheduleUrl) {
                    setScheduleUrl(settings.scheduleUrl);
                    refreshData(settings.scheduleUrl);
                    console.log("Synchronisation de l'emploi du temps réussie");
                }
                
                if (settings.filiere) setFiliere(settings.filiere);
                if (settings.annee) setAnnee(settings.annee);
                
            } catch (e) {
                console.error("Failed to sync user settings", e);
            }
        };

        syncWithBackend();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Rechargement automatique
    useEffect(() => {
        if (!scheduleUrl) return;

        const interval = setInterval(() => {
            console.log('[ScheduleContext] Rechargement automatique des données...');
            refreshData();
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [scheduleUrl, refreshData]);

    // Fonction pour sauvegarder les paramètres (Backend)
    const saveSettings = async (settings) => {
        try {
            await api.post('/user/settings', settings);
            
            if (settings.scheduleUrl !== undefined) {
                setScheduleUrl(settings.scheduleUrl);
                if (settings.scheduleUrl) {
                    refreshData(settings.scheduleUrl);
                } else {
                    setEvents([]);
                    setExams([]);
                    setHoursBySubject({ S1: [], S2: [], all: [] });
                }
            }
            
            if (settings.filiere !== undefined) setFiliere(settings.filiere);
            if (settings.annee !== undefined) setAnnee(settings.annee);
            
            return true;
        } catch (err) {
            console.error(err);
            setError("Impossible de sauvegarder les paramètres: " + err.message);
            return false;
        }
    };

    // Remplacer saveScheduleUrl par saveSettings pour plus de flexibilité
    // On garde saveScheduleUrl pour la compatibilité si besoin
    const saveScheduleUrl = (url) => saveSettings({ scheduleUrl: url });

    // Calculer l'âge des données
    const getCacheAge = useCallback(() => {
        if (!lastUpdated) return null;
        const ageMs = Date.now() - lastUpdated.getTime();
        
        const minutes = Math.floor(ageMs / (1000 * 60));
        if (minutes < 1) return 'À l\'instant';
        return `Il y a ${minutes} min`;
    }, [lastUpdated]);

    const value = {
        events,
        exams,
        hoursBySubject,
        loading,
        error,
        lastUpdated,
        scheduleUrl,
        filiere,
        annee,
        refreshData,
        getCacheAge,
        saveScheduleUrl,
        saveSettings
    };

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
};

export const useSchedule = () => {
    const context = useContext(ScheduleContext);
    if (!context) {
        throw new Error('useSchedule must be used within a ScheduleProvider');
    }
    return context;
};

export default ScheduleContext;