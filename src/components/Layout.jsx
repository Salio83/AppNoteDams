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
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 shadow-lg">
                                P
                            </div>
                            <h1 className="hidden sm:block text-lg font-bold tracking-tight text-slate-900">
                                Planning&Notes
                            </h1>
                        </div>

                        {/* Navigation Items - Scrollable on mobile */}
                        <div className="flex-1 flex items-center justify-center lg:justify-end gap-1 overflow-x-auto no-scrollbar py-2 mask-linear">
                            <NavItem to="/" icon={Calendar} label="Emploi du Temps" />
                            <NavItem to="/dashboard" icon={LayoutDashboard} label="Aperçu" />
                            <NavItem to="/grades" icon={GraduationCap} label="Notes" />
                            <NavItem to="/averages" icon={BookOpen} label="Moyennes" />
                            <NavItem to="/exams" icon={AlertTriangle} label="Examens" />
                            <NavItem to="/hours" icon={Clock} label="Heures" />
                            <NavItem to="/tasks" icon={ClipboardList} label="Tâches" />
                            {/* Calendar removed from nav as per request "cacher l'ICal" - actually user said "cache l'ICal" referring to the INPUT, but also mentioned "cacher l'ICal" in general. 
                                Wait, user said "on verra uniquement des logos sur les versions responsives pour mobile".
                                And "il faut aussi cacher l'ICal". 
                                The user likely meant hiding the *page* or the *input*? 
                                "on pourra le renseigner dans le profil" implies the INPUT.
                                "il faut aussi cacher l'ICal" might mean the Calendar PAGE if it was just for showing holidays? 
                                Let's assume hiding the Calendar PAGE link for now based on "cacher l'ICal". 
                                Actually, checking standard interpretation: "ICal" usually refers to the link/input. 
                                But there is a page called Calendar.jsx.
                                "cacher l'ICal, on pourra le renseigner dans le profil". This strongly links "ICal" to "renseigner" (inputting data).
                                So I should HIDE the input in Schedule (done later), 
                                AND maybe hiding the "Calendar" page link? 
                                Let's keep "Calendar" page if it's holidays/vacations ("Calendrier" in nav), but maybe user meant that too.
                                Re-reading: "il faut aussi cacher l'ICal" -> likely the calendar view or the input.
                                Given "on pourra le renseigner dans le profil", it 99% refers to the URL input.
                                However, I see `CalendarDays` imported. I will keep it in the nav for now as "Calendrier" (vacations) unless "ICal" meant the calendar page.
                                Actually, wait. "il faut aussi cacher l'ICal" followed by "on pourra le renseigner dans le profil". This sentence structure implies "The thing currently called ICal".
                                Previously `Schedule.jsx` had `Calendar` import? No, `Layout.jsx` had `Calendar` (Emploi du Temps) and `CalendarDays` (Calendrier).
                                The `Schedule` page IS the "Emploi du Temps".
                                The `Calendar` page IS "vacations".
                                The user probably means "The ICal URL Input".
                                I will NOT remove the "Calendrier" (vacations) page link unless I am sure. 
                                BUT, if I look at the previous prompt "Tasks and Calendar Features", the user asked for a "Calendar" tab.
                                So I will keep "Calendrier" link.
                            */}
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

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
