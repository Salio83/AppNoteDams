import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
    { to: '/', label: 'Accueil', end: true },
    { to: '/schedule', label: 'Planning' },
    { to: '/grades', label: 'Notes' },
    { to: '/averages', label: 'Moyennes' },
    { to: '/exams', label: 'Examens' },
    { to: '/hours', label: 'Heures' },
    { to: '/tasks', label: 'Tâches' },
    { to: '/calendar', label: 'Calendrier' },
];

const navLinkClass = ({ isActive }) =>
    `inline-block py-3 text-sm whitespace-nowrap transition-opacity ${isActive ? 'opacity-100' : 'opacity-55 hover:opacity-100'
    }`;

const Layout = ({ children }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen flex flex-col bg-bg text-ink">
            <header className="sticky top-0 z-40 bg-bg border-b border-rule">
                <div
                    className="mx-auto flex flex-wrap items-center justify-between gap-x-8 gap-y-1"
                    style={{ maxWidth: 1180, padding: '0 clamp(16px,4vw,48px)' }}
                >
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        <NavLink to="/" end className="font-display text-[22px] py-3 shrink-0">
                            Krono
                        </NavLink>
                        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1">
                            {NAV_LINKS.map(({ to, label, end }) => (
                                <NavLink key={to} to={to} end={end} className={navLinkClass}>
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-5 shrink-0">
                        <button
                            onClick={toggleTheme}
                            className="py-3 text-sm opacity-70 hover:opacity-100 transition-opacity"
                        >
                            {isDark ? 'Clair' : 'Sombre'}
                        </button>
                        <NavLink to="/profile" className={navLinkClass}>
                            Profil
                        </NavLink>
                    </div>
                </div>
            </header>

            <main
                className="flex-1 mx-auto w-full"
                style={{ maxWidth: 1180, padding: 'clamp(28px,5vw,64px) clamp(16px,4vw,48px)' }}
            >
                {children}
            </main>
        </div>
    );
};

export default Layout;
