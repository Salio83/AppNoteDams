import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import ues from '../../config_ue.json';

const GradeList = ({ grades, onDelete }) => {
    const getUEName = (id) => ues.find(ue => ue.id === id)?.nom || 'Inconnu';

    if (grades.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Aucune note</h3>
                <p className="text-slate-500 text-sm mt-1">Commencez par ajouter une nouvelle note ci-dessus.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Matière</th>
                            <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Note</th>
                            <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Coef</th>
                            <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {grades.map((grade) => (
                            <tr key={grade.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-8 py-5 font-medium text-slate-700">{getUEName(grade.ue_id)}</td>
                                <td className="px-8 py-5">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${grade.value >= 10
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                                        }`}>
                                        {grade.value}/20
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-slate-500 font-medium">{grade.coef}</td>
                                <td className="px-8 py-5 text-right">
                                    <button
                                        onClick={() => onDelete(grade.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GradeList;
