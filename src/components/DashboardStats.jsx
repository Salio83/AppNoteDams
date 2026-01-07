import React from 'react';
import { TrendingUp, Award, BookOpen, Star } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, borderClass }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow duration-200">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-2 tracking-wide uppercase">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="w-5 h-5 text-current" />
        </div>
    </div>
);

const DashboardStats = ({ globalAverage, bestSubject, ueStats }) => {
    return (
        <div className="space-y-10">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Moyenne Générale"
                    value={globalAverage !== null ? globalAverage : '-'}
                    subtitle="Pondérée"
                    icon={TrendingUp}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Meilleure Matière"
                    value={bestSubject ? bestSubject.average : '-'}
                    subtitle={bestSubject ? bestSubject.nom : 'Pas de notes'}
                    icon={Award}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Modules Actifs"
                    value={ueStats.filter(u => u.gradeCount > 0).length}
                    subtitle={`Sur ${ueStats.length} modules`}
                    icon={BookOpen}
                    colorClass="bg-indigo-50 text-indigo-600"
                />
            </div>

            {/* Detailed Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                        Performances par UE
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {ueStats.map((ue) => (
                        <div key={ue.id} className="bg-white p-5 rounded-2xl border border-slate-100/80 hover:border-slate-200 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-semibold text-slate-700 truncate pr-2 group-hover:text-slate-900 transition-colors">{ue.nom}</h4>
                                <span className="text-[10px] font-bold tracking-wider px-2 py-1 bg-slate-50 text-slate-500 rounded-md uppercase border border-slate-100">
                                    Coef {ue.coef_ue}
                                </span>
                            </div>

                            <div className="flex justify-between items-end mb-4">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${ue.gradeCount > 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                    <p className="text-xs text-slate-400 font-medium">{ue.gradeCount} note(s)</p>
                                </div>
                                <div className={`text-2xl font-bold tracking-tight ${!ue.average ? 'text-slate-200' :
                                        ue.average >= 10 ? 'text-emerald-600' : 'text-rose-500'
                                    }`}>
                                    {ue.average !== null ? ue.average : '-'}
                                </div>
                            </div>

                            {/* Progress bar visual */}
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${ue.average >= 10 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`}
                                    style={{ width: `${Math.min(((ue.average || 0) / 20) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;
