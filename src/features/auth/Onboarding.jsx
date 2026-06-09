import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, Calendar, ChevronRight, ChevronLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { api } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';

const FILIERES = [
    'DaMS',
    'STE',
    'GBA',
    'MEA',
    'MAT',
    'MI',
    'DO',
    'EGC',
    'GI',
    'MSI',
    'SE',
    'PEIP'
];

const ANNEES = ['1A', '2A', '3A', '4A', '5A'];
const GROUPES = ['G1','G2','G3','G4','G5','G6','G7'];

const StepIndicator = ({ current, total }) => (
    <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: total }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${i < current
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50'
                        : i === current
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-600 dark:ring-indigo-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    }`}>
                    {i < current ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < total - 1 && (
                    <div className={`w-12 h-0.5 transition-all duration-300 ${i < current ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`} />
                )}
            </div>
        ))}
    </div>
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

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // 1. Save profile settings
            await api.post('/user/settings', {
                filiere: effectiveFiliere,
                annee,
                groupe
            });

            // 2. Try to match and import schedule
            const result = await api.get(`/user/match-schedule?filiere=${encodeURIComponent(effectiveFiliere)}&annee=${encodeURIComponent(annee)}&groupe=${encodeURIComponent(groupe)}`);
            setMatchResult(result);

            // 3. Wait a moment to show result, then redirect
            setTimeout(() => {
                setNeedsOnboarding(false);
                navigate('/');
            }, result.matched ? 2500 : 1500);

        } catch (error) {
            console.error('Onboarding error:', error);
            // Even if matching fails, complete onboarding
            setNeedsOnboarding(false);
            navigate('/');
        }
    };

    // Completion screen
    if (matchResult !== null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
                <div className="w-full max-w-md text-center animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200/60 dark:border-slate-700">
                        {matchResult.matched ? (
                            <>
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Emploi du temps importé !
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400">
                                    {matchResult.eventsCount} événements ont été importés depuis un camarade de votre groupe.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Profil configuré !
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Aucun emploi du temps trouvé pour votre groupe. Vous pourrez l'ajouter dans votre profil.
                                </p>
                            </>
                        )}
                        <div className="mt-4">
                            <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200/60 dark:border-slate-700">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                            Bienvenue !
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Configurons votre profil étudiant
                        </p>
                    </div>

                    <StepIndicator current={step} total={3} />

                    {/* Step 0: Filière */}
                    {step === 0 && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                    Dans quelle filière êtes-vous ?
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {FILIERES.map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFiliere(f)}
                                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${filiere === f
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                                {filiere === 'Autres' && (
                                    <input
                                        type="text"
                                        value={customFiliere}
                                        onChange={(e) => setCustomFiliere(e.target.value)}
                                        placeholder="Nom de votre filière..."
                                        className="w-full mt-3 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 1: Année */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                    En quelle année êtes-vous ?
                                </label>
                                <div className="flex gap-2">
                                    {ANNEES.map(a => (
                                        <button
                                            key={a}
                                            onClick={() => setAnnee(a)}
                                            className={`flex-1 px-4 py-4 rounded-xl text-sm font-bold transition-all border ${annee === a
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Groupe */}
                    {step === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Quel est votre groupe ?
                                </label>
                                <div className="flex gap-2">
                                    {GROUPES.map(a => (
                                        <button
                                            key={a}
                                            onClick={() => setGroupe(a)}
                                            className={`flex-1 px-4 py-4 rounded-xl text-sm font-bold transition-all border ${groupe === a
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3">
                                <div className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Si un autre étudiant de votre groupe a déjà configuré son emploi du temps, il sera automatiquement importé.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={handleBack}
                            disabled={step === 0}
                            className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${step === 0
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Retour
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!canProceed() || loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200 dark:shadow-none"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : step === 2 ? (
                                <>
                                    Terminer
                                    <Check className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Suivant
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
