import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Calendar, Settings, UserCircle, BookOpen, AlertTriangle, Clock, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
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

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
            {/* Sidebar */}
            <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col fixed h-full z-20 transition-all duration-300">
                <div className="p-8">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 shadow-lg">
                            S
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            StudentHub
                        </h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-10 font-medium tracking-wide uppercase">Tableau de bord</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <SidebarItem to="/" icon={LayoutDashboard} label="Aperçu Général" />
                    <SidebarItem to="/grades" icon={GraduationCap} label="Mes Notes" />
                    <SidebarItem to="/averages" icon={BookOpen} label="Moyennes" />
                    <SidebarItem to="/schedule" icon={Calendar} label="Emploi du Temps" />
                    <SidebarItem to="/exams" icon={AlertTriangle} label="Examens" />
                    <SidebarItem to="/hours" icon={Clock} label="Heures restantes" />
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
            <main className="flex-1 ml-72">
                <div className="max-w-6xl mx-auto p-12">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
