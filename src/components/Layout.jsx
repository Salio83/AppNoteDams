import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, UserCircle, BookOpen, AlertTriangle, Clock, LogOut, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            clsx(
                'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            )
        }
    >
        <Icon className="w-[18px] h-[18px]" />
        <span>{label}</span>
    </NavLink>
);

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 shadow-lg">
                        P
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                        Planning&Notes
                    </h1>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col fixed h-full z-40 transition-all duration-300",
                "w-72 lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                "top-0 lg:top-0"
            )}>
                <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 shadow-lg">
                            P
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Planning&Notes
                        </h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-10 font-medium tracking-wide uppercase">Tableau de bord</p>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <SidebarItem to="/" icon={Calendar} label="Emploi du Temps" onClick={closeSidebar} />
                    <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Aperçu Général" onClick={closeSidebar} />
                    <SidebarItem to="/grades" icon={GraduationCap} label="Mes Notes" onClick={closeSidebar} />
                    <SidebarItem to="/averages" icon={BookOpen} label="Moyennes" onClick={closeSidebar} />
                    <SidebarItem to="/exams" icon={AlertTriangle} label="Examens" onClick={closeSidebar} />
                    <SidebarItem to="/hours" icon={Clock} label="Heures restantes" onClick={closeSidebar} />
                </nav>


                <div className="p-4 m-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <UserCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                                {user?.email?.split('@')[0] || 'Utilisateur'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 pt-16 lg:pt-0">
                <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-12">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
