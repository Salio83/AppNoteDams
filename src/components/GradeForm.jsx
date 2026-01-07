import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import ues from '../../config_ue.json';

const GradeForm = ({ onAddGrade }) => {
    const [selectedUE, setSelectedUE] = useState(ues[0]?.id || '');
    const [grade, setGrade] = useState('');
    const [coef, setCoef] = useState('1');

    // Group UEs by category
    const groupedUEs = useMemo(() => {
        return ues.reduce((acc, ue) => {
            const category = ue.category || 'Autres';
            if (!acc[category]) acc[category] = [];
            acc[category].push(ue);
            return acc;
        }, {});
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedUE || grade === '' || coef === '') return;

        const newGrade = {
            id: crypto.randomUUID(),
            ue_id: parseInt(selectedUE),
            value: parseFloat(grade),
            coef: parseFloat(coef),
            date: new Date().toISOString()
        };

        onAddGrade(newGrade);
        setGrade('');
        setCoef('1');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-1 shadow-sm border border-slate-200/60 flex items-center gap-2 mb-8">
            <select
                value={selectedUE}
                onChange={(e) => setSelectedUE(e.target.value)}
                className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 py-3 pl-4 max-w-[50%]"
            >
                {Object.entries(groupedUEs).map(([category, items]) => (
                    <optgroup key={category} label={category}>
                        {items.map(ue => (
                            <option key={ue.id} value={ue.id}>{ue.nom} (Coef {ue.coef_ue})</option>
                        ))}
                    </optgroup>
                ))}
            </select>

            <div className="h-8 w-px bg-slate-200"></div>

            <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-24 bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 py-3"
                placeholder="Note"
                required
            />

            <div className="h-8 w-px bg-slate-200"></div>

            <input
                type="number"
                min="0.1"
                step="0.1"
                value={coef}
                onChange={(e) => setCoef(e.target.value)}
                className="w-24 bg-transparent border-none text-sm font-medium focus:ring-0 text-slate-700 py-3"
                placeholder="Coef"
                required
            />

            <button
                type="submit"
                className="bg-slate-900 text-white rounded-xl px-4 py-2 mr-1 hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium flex-shrink-0"
            >
                <Plus className="w-4 h-4" />
                Ajouter
            </button>
        </form>
    );
};

export default GradeForm;
