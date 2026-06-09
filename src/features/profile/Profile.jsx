import React, { useState, useEffect } from 'react';
import { Save, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { useSchedule } from '../../shared/context/ScheduleContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, logout } = useAuth();
    const { saveSettings, scheduleUrl, filiere: contextFiliere, annee: contextAnnee, groupe: contextGroupe } = useSchedule();
    const navigate = useNavigate();

    // States for form fields
    const [icalUrl, setIcalUrl] = useState(scheduleUrl || '');
    const [filiere, setFiliere] = useState(contextFiliere || '');
    const [annee, setAnnee] = useState(contextAnnee || '');
    const [groupe, setGroupe] = useState(contextGroupe || '');
    const [savedv, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync with context values (loaded from backend)
    useEffect(() => {
        if (scheduleUrl) setIcalUrl(scheduleUrl);
        if (contextFiliere) setFiliere(contextFiliere);
        if (contextAnnee) setAnnee(contextAnnee);
        if (contextGroupe) setGroupe(contextGroupe);
    }, [scheduleUrl, contextFiliere, contextAnnee, contextGroupe]);


    const handleSave = async () => {
        setIsSaving(true);
        const success = await saveSettings({
            scheduleUrl: icalUrl,
            filiere,
            annee,
            groupe
        });

        if (success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
        setIsSaving(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <header>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <UserCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    Mon Profil
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos préférences et informations personnelles</p>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 p-6 space-y-6">

                {/* User Info Section */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Compte Utilisateur</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Se déconnecter"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <hr className="border-slate-100 dark:border-slate-700" />

                {/* Form Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            URL de l'emploi du temps (ICal)
                        </label>
                        <input
                            type="text"
                            value={icalUrl}
                            onChange={(e) => setIcalUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-indigo-500 transition-all text-sm"
                        />
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            Lien .ics fourni par l'université pour synchroniser votre emploi du temps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Filière
                            </label>
                            <input
                                type="text"
                                value={filiere}
                                onChange={(e) => setFiliere(e.target.value)}
                                placeholder="Ex: Informatique"
                                className="w-full rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-indigo-500 transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Année
                            </label>
                            <input
                                type="text"
                                value={annee}
                                onChange={(e) => setAnnee(e.target.value)}
                                placeholder="Ex: L3, M1..."
                                className="w-full rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-indigo-500 transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Groupe
                            </label>
                            <input
                                type="text"
                                value={groupe}
                                onChange={(e) => setGroupe(e.target.value)}
                                placeholder="Ex: G1, TP2..."
                                className="w-full rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-indigo-500 transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                    {savedv && (
                        <span className="text-sm text-emerald-600 font-medium animate-fadeIn">
                            Modifications enregistrées !
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm shadow-indigo-200"
                    >
                        <Save className="w-4 h-4" />
                        Enregistrer
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Profile;
