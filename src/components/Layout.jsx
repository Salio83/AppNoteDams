import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, GraduationCap, Calendar, UserCircle, AlertTriangle, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SearchBar from './SearchBar';

const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
                isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            )
        }
        title={label}
    >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
    </NavLink>
);

const Layout = ({ children }) => {
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
            {/* Top Navigation Bar - Centered around logo */}
            <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 transition-all duration-300">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-center gap-6">

                        {/* Left section - Search */}
                        <div className="hidden lg:flex items-center">
                            <SearchBar />
                        </div>

                        {/* Center section - Logo + Main Nav */}
                        <div className="flex items-center gap-4">
                            {/* Logo */}
                            <NavLink to="/" className="flex items-center gap-2 shrink-0">
                                <img
                                    src="/fulllogoKrono.png"
                                    alt="Krono"
                                    className="h-8 w-auto dark:hidden"
                                />
                                <img
                                    src="/fulllogoKronowobg.png"
                                    alt="Krono"
                                    className="h-8 w-auto hidden dark:block"
                                />
                            </NavLink>

                            {/* Main Navigation - Desktop only */}
                            <div className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl p-1">
                                <NavItem to="/" icon={Home} label="Accueil" />
                                <NavItem to="/schedule" icon={Calendar} label="Planning" />
                                <NavItem to="/grades" icon={GraduationCap} label="Notes" />
                                <NavItem to="/exams" icon={AlertTriangle} label="Examens" />
                            </div>
                        </div>

                        {/* Right section - Theme Toggle & Profile */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                                title={isDark ? 'Mode clair' : 'Mode sombre'}
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            <NavLink
                                to="/profile"
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 shrink-0 border',
                                        isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                    )
                                }
                                title="Mon Profil"
                            >
                                <UserCircle className="w-6 h-6" />
                            </NavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] pb-safe">
                <div className="flex justify-around items-center h-16 px-2">
                    <NavLink to="/" className={({ isActive }) => clsx("flex flex-col items-center justify-center gap-1 transition-colors px-3 py-2", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300")}><Home className="w-6 h-6" /><span className="text-[10px] font-medium">Accueil</span></NavLink>

                    {/* Center Action Button - Planning */}
                    <NavLink to="/schedule" className={({ isActive }) => clsx("flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-indigo-500/30 -mt-6 transition-transform active:scale-95", isActive ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white hover:bg-indigo-600")}>
                        <Calendar className="w-7 h-7" />
                    </NavLink>

                    <NavLink to="/grades" className={({ isActive }) => clsx("flex flex-col items-center justify-center gap-1 transition-colors px-3 py-2", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300")}><GraduationCap className="w-6 h-6" /><span className="text-[10px] font-medium">Notes</span></NavLink>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-screen-2xl mx-auto w-full p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;


