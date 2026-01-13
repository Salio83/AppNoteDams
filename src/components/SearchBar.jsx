import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calendar, GraduationCap, BookOpen, Clock, X, AlertTriangle, MapPin, Command, ChevronRight, TrendingUp } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ues from '../../config_ue.json';

const SearchBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [grades, setGrades] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { events, exams } = useSchedule();
    const { user } = useAuth();

    // Load grades for preview
    useEffect(() => {
        const loadGrades = async () => {
            if (!user) return;
            try {
                const { data } = await supabase
                    .from('grades')
                    .select('*')
                    .eq('user_id', user.id);
                if (data) setGrades(data.map(g => ({ ...g, value: parseFloat(g.value), coef: parseFloat(g.coef) })));
            } catch (e) {
                console.error('Error loading grades:', e);
            }
        };
        if (isOpen) loadGrades();
    }, [isOpen, user]);

    // Find subject info for preview
    const getSubjectInfo = (subjectName) => {
        const now = new Date();

        // Find UE and matière
        let foundUE = null;
        let foundMatiere = null;

        for (const ue of ues) {
            if (ue.nom.toLowerCase().includes(subjectName.toLowerCase())) {
                foundUE = ue;
                break;
            }
            for (const mat of ue.matieres || []) {
                if (mat.nom.toLowerCase().includes(subjectName.toLowerCase())) {
                    foundUE = ue;
                    foundMatiere = mat;
                    break;
                }
            }
            if (foundMatiere) break;
        }

        if (!foundUE) return null;

        // Get the subject with its aliases
        const subject = foundMatiere || foundUE;
        const nameToSearch = subject.nom;
        const aliases = subject.aliases || [];

        // Build search terms: use aliases first, then distinctive keywords from name
        let searchTerms = aliases.map(a => a.toLowerCase());

        // Extract distinctive keywords (5+ chars, excluding common words)
        const commonWords = ['pour', 'avec', 'dans', 'introduction', 'projet', 'analyse', 'fondamentaux'];
        const nameKeywords = nameToSearch.toLowerCase()
            .replace(/[''&]/g, ' ')
            .split(/[\s,.-]+/)
            .filter(w => w.length >= 5 && !commonWords.includes(w))
            .sort((a, b) => b.length - a.length); // Longest first

        // Add top 2 most distinctive keywords
        searchTerms.push(...nameKeywords.slice(0, 2));

        // Fallback: first word if no good keywords
        if (searchTerms.length === 0) {
            const firstWord = nameToSearch.split(/[\s,.-]+/)[0].toLowerCase();
            if (firstWord.length >= 5) searchTerms.push(firstWord);
        }

        // Helper to check if event matches subject - require 5+ char match
        const matchesSubject = (eventTitle) => {
            const title = (eventTitle || '').toLowerCase().replace(/[''&]/g, ' ');
            return searchTerms.some(term => {
                const matchLen = Math.min(term.length, 5);
                return title.includes(term.substring(0, matchLen));
            });
        };

        // Find next course for this subject
        let nextCourse = null;
        if (events) {
            const subjectEvents = events
                .filter(e => {
                    const summary = e.summary || e.title || '';
                    return matchesSubject(summary) && new Date(e.start) > now;
                })
                .sort((a, b) => new Date(a.start) - new Date(b.start));
            nextCourse = subjectEvents[0] || null;
        }

        // Find next DS for this subject
        let nextDS = null;
        if (exams) {
            const subjectExams = exams
                .filter(e => {
                    const title = e.title || e.summary || '';
                    return matchesSubject(title) && new Date(e.start) > now;
                })
                .sort((a, b) => new Date(a.start) - new Date(b.start));
            nextDS = subjectExams[0] || null;
        }

        // Calculate subject average
        let subjectAverage = null;
        const targetId = foundMatiere ? foundMatiere.id : foundUE.id;
        const subjectGrades = grades.filter(g => g.ue_id === targetId);
        if (subjectGrades.length > 0) {
            const totalWeighted = subjectGrades.reduce((sum, g) => sum + g.value * g.coef, 0);
            const totalCoef = subjectGrades.reduce((sum, g) => sum + g.coef, 0);
            subjectAverage = totalCoef > 0 ? totalWeighted / totalCoef : null;
        }

        // Calculate UE average
        let ueAverage = null;
        const allMatiereIds = [foundUE.id, ...(foundUE.matieres || []).map(m => m.id)];
        const ueGrades = grades.filter(g => allMatiereIds.includes(g.ue_id));
        if (ueGrades.length > 0) {
            const totalWeighted = ueGrades.reduce((sum, g) => sum + g.value * g.coef, 0);
            const totalCoef = ueGrades.reduce((sum, g) => sum + g.coef, 0);
            ueAverage = totalCoef > 0 ? totalWeighted / totalCoef : null;
        }

        return {
            name: foundMatiere ? foundMatiere.nom : foundUE.nom,
            ueName: foundUE.nom,
            isUE: !foundMatiere,
            nextCourse,
            nextDS,
            subjectAverage,
            ueAverage
        };
    };

    // Generate searchable items
    const searchItems = useMemo(() => {
        const items = [];

        // Pages
        items.push(
            { type: 'page', title: 'Accueil', path: '/', icon: Calendar },
            { type: 'page', title: 'Emploi du temps', path: '/schedule', icon: Calendar },
            { type: 'page', title: 'Notes', path: '/grades', icon: GraduationCap },
            { type: 'page', title: 'Examens', path: '/exams', icon: AlertTriangle },
            { type: 'page', title: 'Heures restantes', path: '/hours', icon: Clock },
        );

        // UEs/Subjects
        ues.forEach(ue => {
            items.push({
                type: 'subject',
                title: ue.nom,
                subtitle: `UE • Coef ${ue.coef_ue}`,
                path: '/grades',
                icon: BookOpen,
                subjectName: ue.nom
            });
            (ue.matieres || []).forEach(mat => {
                items.push({
                    type: 'subject',
                    title: mat.nom,
                    subtitle: ue.nom,
                    path: '/grades',
                    icon: GraduationCap,
                    subjectName: mat.nom
                });
            });
        });

        // Schedule events (rooms)
        if (events) {
            const uniqueRooms = new Set();
            events.forEach(event => {
                if (event.location && !uniqueRooms.has(event.location)) {
                    uniqueRooms.add(event.location);
                    items.push({
                        type: 'room',
                        title: event.location,
                        subtitle: 'Salle de cours',
                        path: '/schedule',
                        icon: MapPin,
                    });
                }
            });
        }

        return items;
    }, [events]);

    // Filter results
    const results = useMemo(() => {
        if (!query.trim()) return searchItems.slice(0, 8);
        const lowerQuery = query.toLowerCase();
        return searchItems
            .filter(item => {
                const titleMatch = item.title && item.title.toLowerCase().includes(lowerQuery);
                const subtitleMatch = item.subtitle && item.subtitle.toLowerCase().includes(lowerQuery);
                return titleMatch || subtitleMatch;
            })
            .slice(0, 8);
    }, [query, searchItems]);

    // No longer auto-update on hover - preview shows on click only

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setSelectedSubject(null);
        }
    }, [isOpen]);

    // Navigate results with keyboard
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            navigate(results[selectedIndex].path);
            setIsOpen(false);
        }
    };

    const handleSelect = (item) => {
        navigate(item.path);
        setIsOpen(false);
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
        if (d.toDateString() === tomorrow.toDateString()) return "Demain";
        return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const formatTime = (date) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
            >
                <Search className="w-4 h-4" />
                <span className="hidden xl:inline">Rechercher...</span>
                <kbd className="hidden xl:flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-xs font-mono text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600">
                    <Command className="w-3 h-3" />K
                </kbd>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 animate-fadeIn"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 animate-slideUp">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Rechercher une page, matière, salle..."
                            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    {/* Results with Optional Preview */}
                    <div className="flex max-h-[60vh]">
                        {/* Results List */}
                        <div className={`${selectedSubject ? 'w-1/2 border-r border-slate-100 dark:border-slate-700' : 'w-full'} overflow-y-auto p-2`}>
                            {results.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                                    Aucun résultat pour "{query}"
                                </div>
                            ) : (
                                results.map((item, index) => {
                                    const Icon = item.icon;
                                    const isSubject = item.type === 'subject';
                                    return (
                                        <button
                                            key={`${item.type}-${item.title}-${index}`}
                                            onClick={() => {
                                                if (isSubject) {
                                                    // Show preview on click for subjects
                                                    setSelectedSubject(getSubjectInfo(item.subjectName));
                                                } else {
                                                    handleSelect(item);
                                                }
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${index === selectedIndex
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${index === selectedIndex
                                                ? 'bg-indigo-100 dark:bg-indigo-900/50'
                                                : 'bg-slate-100 dark:bg-slate-700'
                                                }`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{item.title}</div>
                                                {item.subtitle && (
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                                        {item.subtitle}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                                                {item.type === 'page' ? 'Page' : item.type === 'subject' ? 'Matière' : item.type === 'room' ? 'Salle' : 'Cours'}
                                            </span>
                                            {isSubject && (
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Subject Preview Panel */}
                        {selectedSubject && (
                            <div className="w-1/2 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                                {/* Header with back button */}
                                <div className="flex items-center gap-2 mb-4">
                                    <button
                                        onClick={() => setSelectedSubject(null)}
                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-500" />
                                    </button>
                                    <h3 className="font-bold text-slate-800 dark:text-white">{selectedSubject.name}</h3>
                                </div>

                                {/* Averages */}
                                <div className="space-y-2 mb-4">
                                    <Link
                                        to="/grades"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">Moyenne matière</span>
                                        </div>
                                        <span className={`font-bold ${selectedSubject.subjectAverage !== null ? (selectedSubject.subjectAverage >= 10 ? 'text-emerald-600' : 'text-rose-500') : 'text-slate-400'}`}>
                                            {selectedSubject.subjectAverage !== null ? `${selectedSubject.subjectAverage.toFixed(2)}/20` : '—'}
                                        </span>
                                    </Link>

                                    {!selectedSubject.isUE && (
                                        <Link
                                            to="/grades"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300">Moyenne {selectedSubject.ueName}</span>
                                            </div>
                                            <span className={`font-bold ${selectedSubject.ueAverage !== null ? (selectedSubject.ueAverage >= 10 ? 'text-emerald-600' : 'text-rose-500') : 'text-slate-400'}`}>
                                                {selectedSubject.ueAverage !== null ? `${selectedSubject.ueAverage.toFixed(2)}/20` : '—'}
                                            </span>
                                        </Link>
                                    )}
                                </div>

                                {/* Next Course */}
                                <div className="mb-3">
                                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Prochain cours</div>
                                    {selectedSubject.nextCourse ? (
                                        <Link
                                            to="/schedule"
                                            onClick={() => setIsOpen(false)}
                                            className="block p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                                                <Calendar className="w-4 h-4" />
                                                <span className="font-medium">{formatDate(selectedSubject.nextCourse.start)}</span>
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                {formatTime(selectedSubject.nextCourse.start)} - {formatTime(selectedSubject.nextCourse.end)}
                                            </div>
                                            {selectedSubject.nextCourse.location && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    📍 {selectedSubject.nextCourse.location}
                                                </div>
                                            )}
                                        </Link>
                                    ) : (
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-400">
                                            Aucun cours prévu
                                        </div>
                                    )}
                                </div>

                                {/* Next DS */}
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Prochain DS</div>
                                    {selectedSubject.nextDS ? (
                                        <Link
                                            to="/exams"
                                            onClick={() => setIsOpen(false)}
                                            className="block p-3 bg-rose-50 dark:bg-rose-900/30 rounded-lg hover:shadow-md transition-all border border-rose-200 dark:border-rose-800"
                                        >
                                            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="font-medium">{formatDate(selectedSubject.nextDS.start)}</span>
                                            </div>
                                            <div className="text-sm text-rose-700 dark:text-rose-300">
                                                {formatTime(selectedSubject.nextDS.start)}
                                            </div>
                                            {selectedSubject.nextDS.location && (
                                                <div className="text-xs text-rose-500 dark:text-rose-400 mt-1">
                                                    📍 {selectedSubject.nextDS.location}
                                                </div>
                                            )}
                                        </Link>
                                    ) : (
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-400">
                                            Aucun DS prévu
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↑↓</kbd>
                            <span>naviguer</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Entrée</kbd>
                            <span>sélectionner</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Échap</kbd>
                            <span>fermer</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SearchBar;
