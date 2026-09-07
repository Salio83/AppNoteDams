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

const navPillClass = 'px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors';
const navPillStyle = ({ isActive }) => (isActive
    ? { background: 'var(--accent-solid)', color: 'var(--bg)', fontWeight: 600 }
    : { background: 'var(--surface)', color: 'var(--ink)', opacity: 0.75 });

const Layout = ({ children }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen flex flex-col bg-bg text-ink">
            <header className="sticky top-0 z-40 bg-bg border-b border-rule">
                <div
                    className="mx-auto flex flex-wrap items-center justify-between gap-x-8 gap-y-2"
                    style={{ maxWidth: 1180, padding: '10px clamp(16px,4vw,48px)' }}
                >
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <NavLink to="/" end className="font-display text-[22px] shrink-0">
                            Krono
                        </NavLink>
                        <nav className="flex flex-wrap items-center gap-1.5">
                            {NAV_LINKS.map(({ to, label, end }) => (
                                <NavLink key={to} to={to} end={end} className={navPillClass} style={navPillStyle}>
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                            onClick={toggleTheme}
                            className={navPillClass}
                            style={{ background: 'var(--surface)', color: 'var(--ink)', opacity: 0.75 }}
                        >
                            {isDark ? 'Clair' : 'Sombre'}
                        </button>
                        <NavLink to="/profile" className={navPillClass} style={navPillStyle}>
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
