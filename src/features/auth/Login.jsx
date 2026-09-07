import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { api } from '../../shared/services/api';

const inputClass = "w-full bg-surface rounded-full text-sm py-3 px-5";

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login, register, setNeedsOnboarding } = useAuth();
    const navigate = useNavigate();

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
        <div className="min-h-screen flex items-center justify-center bg-bg p-4">
            <div className="w-full" style={{ maxWidth: 400 }}>
                <p className="font-display text-[24px] text-center mb-8">Krono</p>

                <h1 className="text-[32px] font-display text-center">
                    {isRegister ? 'Créer un compte' : 'Connexion'}
                </h1>
                <p className="text-muted text-center mt-1 mb-8">
                    {isRegister ? 'Inscription rapide, aucune vérification requise' : 'Accédez à votre espace personnel'}
                </p>

                {error && (
                    <p className="text-sm mb-4 text-center" style={{ color: 'var(--accent)' }}>{error}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className={inputClass}
                        placeholder="Pseudo ou email"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Mot de passe"
                        minLength={6}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full py-3 font-semibold disabled:opacity-50"
                        style={{ background: 'var(--accent-solid)', color: 'var(--bg)' }}
                    >
                        {loading ? '…' : isRegister ? 'Créer mon compte' : 'Se connecter'}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => { setIsRegister(!isRegister); setError(null); }}
                    className="w-full rounded-full py-3 font-semibold mt-3"
                    style={{ border: '1px solid var(--rule)' }}
                >
                    {isRegister ? 'Se connecter' : 'Créer un compte gratuitement'}
                </button>
            </div>
        </div>
    );
};

export default Login;
