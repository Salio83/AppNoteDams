import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, UserCircle, BookOpen, AlertTriangle, Clock, ClipboardList, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group',
                isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            )
        }
        title={label}
    >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="hidden lg:block text-sm font-medium whitespace-nowrap">{label}</span>
    </NavLink>
);

const Layout = ({ children }) => {
    const { user } = useAuth();
    // Removed isSidebarOpen state and logic as we are moving to a horizontal navbar

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between gap-4">

                        {/* Logo Section */}
                        <div className="flex items-center gap-2 shrink-0">
                            <img
                                src="/fulllogoKrono.png"
                                alt="Krono"
                                className="h-8 sm:h-9 w-auto"
                            />
                        </div>

                        {/* DESKTOP NAVIGATION - Hidden on Mobile */}
                        <div className="hidden lg:flex flex-1 items-center justify-end gap-1">
                            <NavItem to="/" icon={Calendar} label="Emploi du Temps" />
                            <NavItem to="/dashboard" icon={LayoutDashboard} label="Aperçu" />
                            <NavItem to="/grades" icon={GraduationCap} label="Notes" />
                            <NavItem to="/averages" icon={BookOpen} label="Moyennes" />
                            <NavItem to="/exams" icon={AlertTriangle} label="Examens" />
                            <NavItem to="/hours" icon={Clock} label="Heures" />
                            <NavItem to="/tasks" icon={ClipboardList} label="Tâches" />
                            <NavItem to="/calendar" icon={CalendarDays} label="Calendrier" />
                        </div>

                        {/* Profile Link */}
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 shrink-0 border border-slate-200',
                                    isActive
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                )
                            }
                            title="Mon Profil"
                        >
                            <UserCircle className="w-6 h-6" />
                        </NavLink>
                    </div>
                </div>
            </nav>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
                <div className="flex justify-around items-end h-16 px-2 pb-2">
                    <NavLink to="/dashboard" className={({ isActive }) => clsx("flex flex-col items-center justify-center w-full pb-1 gap-1 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600")}><LayoutDashboard className="w-6 h-6" /><span className="text-[10px] font-medium">Aperçu</span></NavLink>
                    <NavLink to="/grades" className={({ isActive }) => clsx("flex flex-col items-center justify-center w-full pb-1 gap-1 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600")}><GraduationCap className="w-6 h-6" /><span className="text-[10px] font-medium">Notes</span></NavLink>

                    {/* Center Action Button - Planning */}
                    <div className="relative -top-5 w-full flex justify-center pointer-events-none">
                        <NavLink to="/" className={({ isActive }) => clsx("pointer-events-auto flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-indigo-200 border-4 border-slate-50 transition-transform active:scale-95", isActive ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white hover:bg-indigo-600")}>
                            <Calendar className="w-7 h-7" />
                        </NavLink>
                    </div>

                    <NavLink to="/exams" className={({ isActive }) => clsx("flex flex-col items-center justify-center w-full pb-1 gap-1 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600")}><AlertTriangle className="w-6 h-6" /><span className="text-[10px] font-medium">Examens</span></NavLink>
                    <NavLink to="/averages" className={({ isActive }) => clsx("flex flex-col items-center justify-center w-full pb-1 gap-1 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600")}><BookOpen className="w-6 h-6" /><span className="text-[10px] font-medium">Moy</span></NavLink>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
