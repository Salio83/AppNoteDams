import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';

const FILIERES = ['DaMS', 'STE', 'GBA', 'MEA', 'MAT', 'MI', 'DO', 'EGC', 'GI', 'MSI', 'SE', 'PEIP'];
const ANNEES = ['1A', '2A', '3A', '4A', '5A'];
const GROUPES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];

const PillButton = ({ selected, onClick, children }) => (
    <button
        onClick={onClick}
        className="px-4 py-3 rounded-full text-sm font-medium transition-colors"
        style={selected
            ? { background: 'var(--accent-solid)', color: 'var(--bg)' }
            : { border: '1px solid var(--rule)' }}
    >
        {children}
    </button>
);

const Onboarding = () => {
    const navigate = useNavigate();
    const { setNeedsOnboarding } = useAuth();
    const [step, setStep] = useState(0);
    const [filiere, setFiliere] = useState('');
    const [customFiliere, setCustomFiliere] = useState('');
    const [annee, setAnnee] = useState('');
    const [groupe, setGroupe] = useState('');
    const [loading, setLoading] = useState(false);
    const [matchResult, setMatchResult] = useState(null);

    const effectiveFiliere = filiere === 'Autres' ? customFiliere : filiere;

    const canProceed = () => {
        if (step === 0) return !!effectiveFiliere;
        if (step === 1) return !!annee;
        if (step === 2) return !!groupe;
        return true;
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            await api.post('/user/settings', { filiere: effectiveFiliere, annee, groupe });
            const result = await api.get(`/user/match-schedule?filiere=${encodeURIComponent(effectiveFiliere)}&annee=${encodeURIComponent(annee)}&groupe=${encodeURIComponent(groupe)}`);
            setMatchResult(result);
            setTimeout(() => {
                setNeedsOnboarding(false);
                navigate('/');
            }, result.matched ? 2500 : 1500);
        } catch (error) {
            console.error('Onboarding error:', error);
            setNeedsOnboarding(false);
            navigate('/');
        }
    };

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
        else handleComplete();
    };

    const handleSkip = () => {
        if (step < 2) setStep(step + 1);
        else handleComplete();
    };

    if (matchResult !== null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg p-4">
                <div className="text-center" style={{ maxWidth: 560 }}>
                    <h2 className="font-display text-2xl">
                        {matchResult.matched ? 'Emploi du temps importé !' : 'Profil configuré !'}
                    </h2>
                    <p className="text-muted mt-2">
                        {matchResult.matched
                            ? `${matchResult.eventsCount} événements ont été importés depuis un camarade de votre groupe.`
                            : "Aucun emploi du temps trouvé pour votre groupe. Vous pourrez l'ajouter dans votre profil."}
                    </p>
                </div>
            </div>
        );
    }

    const stepTitle = step === 0
        ? 'Dans quelle filière êtes-vous ?'
        : step === 1
            ? 'En quelle année êtes-vous ?'
            : 'Quel est votre groupe ?';

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-4">
            <div className="w-full" style={{ maxWidth: 560 }}>
                <p className="text-[12px] uppercase text-muted">Étape {step + 1} sur 3</p>
                <div className="h-[4px] rounded-full mt-2 mb-6" style={{ background: 'var(--rule)' }}>
                    <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${((step + 1) / 3) * 100}%`, background: 'var(--accent-solid)' }}
                    />
                </div>

                <h1 className="font-display mb-6" style={{ fontSize: 'clamp(28px,4vw,36px)' }}>{stepTitle}</h1>

                {step === 0 && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {FILIERES.map(f => (
                                <PillButton key={f} selected={filiere === f} onClick={() => setFiliere(f)}>{f}</PillButton>
                            ))}
                        </div>
                        {filiere === 'Autres' && (
                            <input
                                type="text"
                                value={customFiliere}
                                onChange={(e) => setCustomFiliere(e.target.value)}
                                placeholder="Nom de votre filière..."
                                className="w-full bg-surface rounded-full text-sm py-3 px-5"
                                autoFocus
                            />
                        )}
                    </div>
                )}

                {step === 1 && (
                    <div className="flex flex-wrap gap-2">
                        {ANNEES.map(a => (
                            <PillButton key={a} selected={annee === a} onClick={() => setAnnee(a)}>{a}</PillButton>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {GROUPES.map(g => (
                                <PillButton key={g} selected={groupe === g} onClick={() => setGroupe(g)}>{g}</PillButton>
                            ))}
                        </div>
                        <p className="text-[13px] text-muted">
                            Si un autre étudiant de votre groupe a déjà configuré son emploi du temps, il sera automatiquement importé.
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between mt-8">
                    <button onClick={handleSkip} className="text-sm text-muted">
                        Passer cette étape
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!canProceed() || loading}
                        className="rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-50"
                        style={{ background: 'var(--accent-solid)', color: 'var(--bg)' }}
                    >
                        {loading ? '…' : step === 2 ? 'Terminer' : 'Continuer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
