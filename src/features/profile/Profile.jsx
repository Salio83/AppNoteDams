import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { useSchedule } from '../../shared/context/ScheduleContext';

const Field = ({ label, children }) => (
    <div>
        <label className="block text-[12px] text-muted mb-1.5">{label}</label>
        {children}
    </div>
);

const inputClass = "w-full bg-surface rounded-full text-sm py-2.5 px-4";

const Profile = () => {
    const { user, logout } = useAuth();
    const {
        saveSettings, scheduleUrl, filiere: contextFiliere, annee: contextAnnee,
        groupe: contextGroupe, lastUpdated, getCacheAge
    } = useSchedule();
    const navigate = useNavigate();

    const [icalUrl, setIcalUrl] = useState(scheduleUrl || '');
    const [filiere, setFiliere] = useState(contextFiliere || '');
    const [annee, setAnnee] = useState(contextAnnee || '');
    const [groupe, setGroupe] = useState(contextGroupe || '');
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (scheduleUrl) setIcalUrl(scheduleUrl);
        if (contextFiliere) setFiliere(contextFiliere);
        if (contextAnnee) setAnnee(contextAnnee);
        if (contextGroupe) setGroupe(contextGroupe);
    }, [scheduleUrl, contextFiliere, contextAnnee, contextGroupe]);

    const handleSave = async () => {
        setIsSaving(true);
        const success = await saveSettings({ scheduleUrl: icalUrl, filiere, annee, groupe });
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
        <div className="space-y-6" style={{ maxWidth: 640 }}>
            <header>
                <h2 className="font-display text-2xl">Profil</h2>
            </header>

            <div className="flex items-center justify-between pb-4 border-b border-rule">
                <div>
                    <p>{user?.email}</p>
                    {user?.createdAt && (
                        <p className="text-sm text-muted mt-0.5">
                            Membre depuis le {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    )}
                </div>
                <button onClick={handleLogout} className="text-sm text-accent shrink-0">
                    Se déconnecter
                </button>
            </div>

            <div className="space-y-4">
                <Field label="URL de l'emploi du temps (iCal)">
                    <input
                        type="text"
                        value={icalUrl}
                        onChange={(e) => setIcalUrl(e.target.value)}
                        placeholder="https://..."
                        className={inputClass}
                    />
                    <p className="mt-1.5 text-[13px] text-muted">
                        Lien .ics fourni par l'université pour synchroniser votre emploi du temps.
                    </p>
                </Field>

                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                    <Field label="Filière">
                        <input type="text" value={filiere} onChange={(e) => setFiliere(e.target.value)} placeholder="Ex: DaMS" className={inputClass} />
                    </Field>
                    <Field label="Année">
                        <input type="text" value={annee} onChange={(e) => setAnnee(e.target.value)} placeholder="Ex: 3A, 4A…" className={inputClass} />
                    </Field>
                    <Field label="Groupe">
                        <input type="text" value={groupe} onChange={(e) => setGroupe(e.target.value)} placeholder="Ex: G1, TP2…" className={inputClass} />
                    </Field>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted">
                    {lastUpdated ? `Dernière synchronisation ${getCacheAge()?.toLowerCase()}` : ''}
                </p>
                <div className="flex items-center gap-4 shrink-0">
                    {saved && <span className="text-sm text-accent">Enregistré</span>}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
                        style={{ background: 'var(--accent-solid)', color: 'var(--bg)' }}
                    >
                        {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
