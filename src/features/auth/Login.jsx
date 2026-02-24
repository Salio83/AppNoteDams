import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { api } from '../../shared/services/api';
import { LogIn, UserPlus, User, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login, register, setNeedsOnboarding } = useAuth();
    const navigate = useNavigate();

    // Si l'identifiant ne contient pas @, on ajoute un domaine fictif
    const toEmail = (id) => id.includes('@') ? id : `${id}@krono.local`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const email = toEmail(identifier.trim());

        try {
            if (isRegister) {
                await register(email, password, identifier.trim());
                setNeedsOnboarding(true);
                navigate('/onboarding');
            } else {
                await login(email, password);
                // Check if existing user needs onboarding (no filiere set)
                try {
                    const settings = await api.get('/user/settings');
                    if (!settings.filiere) {
                        setNeedsOnboarding(true);
                        navigate('/onboarding');
                    } else {
                        navigate('/');
                    }
                } catch {
                    navigate('/');
                }
            }
        } catch (err) {
            if (isRegister) {
                setError(err.message === 'User already exists'
                    ? 'Ce pseudo ou email est déjà utilisé'
                    : err.message || 'Erreur lors de la création du compte');
            } else {
                setError('Identifiant ou mot de passe incorrect');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200/60 dark:border-slate-700">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            {isRegister ? (
                                <UserPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                                <LogIn className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {isRegister ? 'Créer un compte' : 'Connexion'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {isRegister
                                ? 'Inscription rapide, aucune vérification requise'
                                : 'Accédez à votre espace personnel'}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-lg flex items-center gap-2 text-sm mb-4 border border-rose-100 dark:border-rose-800">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                                Pseudo ou email
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="ex: hugo, ou hugo@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="••••••••"
                                    minLength={6}
                                    required
                                />
                            </div>
                            {isRegister && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                    6 caractères minimum
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : isRegister ? (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Créer mon compte
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider + Toggle */}
                    <div className="mt-6">
                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-white dark:bg-slate-800 px-3 text-slate-400 dark:text-slate-500">
                                    {isRegister ? 'Déjà inscrit ?' : 'Nouveau ?'}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError(null);
                            }}
                            className="w-full py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            {isRegister
                                ? 'Se connecter'
                                : "Créer un compte gratuitement"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
