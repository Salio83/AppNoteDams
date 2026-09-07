import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { getCategoryShortName } from '../../shared/utils/colors';
import { useUEConfig } from '../../shared/hooks/useUEConfig';
import { GradesSetupGuide } from '../../shared/components/SetupGuide';
import PillButton from '../../shared/components/PillButton';

const Toggle = ({ options, value, onChange }) => (
    <div className="flex flex-wrap items-center gap-1.5">
        {options.map(opt => (
            <PillButton key={opt.value} active={value === opt.value} onClick={() => onChange(opt.value)}>
                {opt.label}
            </PillButton>
        ))}
    </div>
);

const Grades = () => {
    const { user } = useAuth();
    const { ues, hasUEConfig } = useUEConfig();
    const [grades, setGrades] = useState([]);
    const [selectedUE, setSelectedUE] = useState('');
    const [grade, setGrade] = useState('');
    const [coef, setCoef] = useState('1');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [activeView, setActiveView] = useState('notes');
    const [rankings, setRankings] = useState(null);
    const [rankingLoading, setRankingLoading] = useState(false);
    const [rankingError, setRankingError] = useState(null);

    useEffect(() => {
        const loadGrades = async () => {
            if (!user) return;
            try {
                const data = await api.get('/grades');
                setGrades(data.map(g => ({
                    id: g.id,
                    ue_id: parseInt(g.ueId),
                    value: g.value,
                    coef: g.coef
                })));
            } catch (error) {
                console.error('Erreur chargement notes:', error);
            } finally {
                setLoading(false);
            }
        };
        loadGrades();
    }, [user]);

    useEffect(() => {
        const loadRankings = async () => {
            if (!user || activeView !== 'ranking') return;
            setRankingLoading(true);
            setRankingError(null);
            try {
                const data = await api.get(`/grades/rankings?semester=${selectedSemester}`);
                if (data.error) {
                    setRankingError(data);
                    setRankings(null);
                } else {
                    setRankings(data);
                }
            } catch (error) {
                console.error('Erreur chargement classements:', error);
                setRankingError({ message: 'Erreur lors de la récupération des classements' });
            } finally {
                setRankingLoading(false);
            }
        };
        loadRankings();
    }, [user, activeView, selectedSemester]);

    const semesterUEs = useMemo(() => ues.filter(ue => ue.semester === selectedSemester), [ues, selectedSemester]);

    useEffect(() => {
        if (semesterUEs.length > 0) setSelectedUE(semesterUEs[0].id);
    }, [semesterUEs]);

    const groupedUEs = useMemo(() => semesterUEs.reduce((acc, ue) => {
        const category = ue.category || 'Autres';
        if (!acc[category]) acc[category] = [];
        acc[category].push(ue);
        return acc;
    }, {}), [semesterUEs]);

    const gradesByUE = useMemo(() => grades.reduce((acc, g) => {
        if (!acc[g.ue_id]) acc[g.ue_id] = [];
        acc[g.ue_id].push(g);
        return acc;
    }, {}), [grades]);

    const calculateUEAverage = (ueId) => {
        const ueGrades = gradesByUE[ueId] || [];
        if (ueGrades.length === 0) return null;
        let totalWeighted = 0, totalCoef = 0;
        ueGrades.forEach(g => { totalWeighted += g.value * g.coef; totalCoef += g.coef; });
        return totalCoef > 0 ? totalWeighted / totalCoef : null;
    };

    const handleAddGrade = async (e) => {
        e.preventDefault();
        if (!selectedUE || grade === '' || coef === '' || !user) return;
        setSaving(true);
        try {
            const data = await api.post('/grades', {
                ue_id: parseInt(selectedUE),
                value: parseFloat(grade),
                coef: parseFloat(coef)
            });
            setGrades([{ id: data.id, ue_id: parseInt(data.ueId), value: data.value, coef: data.coef }, ...grades]);
            setGrade('');
            setCoef('1');
        } catch (error) {
            console.error('Erreur ajout note:', error);
            alert("Erreur lors de l'ajout de la note");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/grades/${id}`);
            setGrades(grades.filter(g => g.id !== id));
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    if (!hasUEConfig) {
        return (
            <div className="space-y-6">
                <header>
                    <h2 className="font-display text-2xl">Notes</h2>
                    <p className="text-muted">Gérez vos notes et suivez vos moyennes</p>
                </header>
                <GradesSetupGuide />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-display text-2xl">Notes</h2>
                <Toggle
                    value={activeView}
                    onChange={setActiveView}
                    options={[{ value: 'notes', label: 'Mes notes' }, { value: 'ranking', label: 'Classement' }]}
                />
            </header>

            <Toggle
                value={selectedSemester}
                onChange={setSelectedSemester}
                options={[{ value: 1, label: 'Semestre 1' }, { value: 2, label: 'Semestre 2' }]}
            />

            {activeView === 'notes' ? (
                <>
                    <form onSubmit={handleAddGrade} className="rounded-[28px] bg-surface p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[12px] text-muted mb-1.5">Matière</label>
                                <select
                                    value={selectedUE}
                                    onChange={(e) => setSelectedUE(e.target.value)}
                                    className="w-full bg-bg rounded-full text-sm py-2.5 px-4"
                                >
                                    {Object.entries(groupedUEs).map(([category, items]) => (
                                        <optgroup key={category} label={getCategoryShortName(category)}>
                                            {items.map(ue => (
                                                <option key={ue.id} value={ue.id}>{ue.nom}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] text-muted mb-1.5">Note /20</label>
                                <input
                                    type="number" min="0" max="20" step="0.01"
                                    value={grade} onChange={(e) => setGrade(e.target.value)}
                                    className="w-full bg-bg rounded-full text-sm py-2.5 px-4"
                                    placeholder="15.5" required
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] text-muted mb-1.5">Coefficient</label>
                                <input
                                    type="number" min="0.1" step="0.1"
                                    value={coef} onChange={(e) => setCoef(e.target.value)}
                                    className="w-full bg-bg rounded-full text-sm py-2.5 px-4"
                                    placeholder="1" required
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
                                style={{ background: 'var(--accent-solid)', color: 'var(--bg)' }}
                            >
                                {saving ? 'Ajout…' : 'Ajouter la note'}
                            </button>
                        </div>
                    </form>

                    {loading ? (
                        <p className="text-muted text-sm">Chargement des notes…</p>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(groupedUEs).map(([category, categoryUEs]) => {
                                let categoryTotal = 0, categoryCoef = 0;
                                categoryUEs.forEach(ue => {
                                    const avg = calculateUEAverage(ue.id);
                                    if (avg !== null) { categoryTotal += avg * ue.coef_ue; categoryCoef += ue.coef_ue; }
                                });
                                const categoryAverage = categoryCoef > 0 ? categoryTotal / categoryCoef : null;

                                return (
                                    <div key={category}>
                                        <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-rule">
                                            <h3 className="font-display text-[22px] flex-1 min-w-0">{getCategoryShortName(category)}</h3>
                                            <span className="text-sm text-muted shrink-0 whitespace-nowrap">
                                                moyenne {categoryAverage !== null ? categoryAverage.toFixed(2) : '—'}
                                            </span>
                                        </div>
                                        {categoryUEs.map(ue => {
                                            const ueGrades = gradesByUE[ue.id] || [];
                                            const ueAverage = calculateUEAverage(ue.id);
                                            return (
                                                <div key={ue.id} className="py-3 border-b border-rule">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="flex-1 min-w-0">{ue.nom}</span>
                                                        <span className="font-semibold tabular-nums shrink-0" style={ueAverage !== null && ueAverage < 10 ? { color: 'var(--accent)' } : undefined}>
                                                            {ueAverage !== null ? ueAverage.toFixed(2) : '—'}
                                                        </span>
                                                    </div>
                                                    {ueGrades.length > 0 && (
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted">
                                                            {ueGrades.map(g => (
                                                                <span key={g.id} className="tabular-nums">
                                                                    {g.value} · coef {g.coef}
                                                                    <button
                                                                        onClick={() => handleDelete(g.id)}
                                                                        className="ml-1 hover:opacity-100 opacity-60"
                                                                        title="Supprimer cette note"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-6">
                    {rankingLoading ? (
                        <p className="text-muted text-sm">Calcul du classement…</p>
                    ) : rankingError ? (
                        <div className="rounded-[28px] bg-surface p-8 text-center">
                            <h3 className="font-display text-xl">Classement indisponible</h3>
                            <p className="text-muted text-sm mt-2">{rankingError.message || 'Une erreur est survenue.'}</p>
                            {rankingError.error === 'missing_profile' && (
                                <Link to="/profile" className="inline-block mt-4 text-sm text-accent">Compléter mon profil</Link>
                            )}
                        </div>
                    ) : rankings ? (
                        <div className="space-y-6">
                            <div className="rounded-[28px] bg-surface p-6 flex flex-wrap items-center justify-between gap-6">
                                <div>
                                    <p className="text-[12px] uppercase text-muted">Moyenne générale</p>
                                    <p className="font-display text-[34px] tabular-nums">
                                        {rankings.overall ? `${rankings.overall.rank}${rankings.overall.rank === 1 ? 'er' : 'ème'} / ${rankings.overall.total}` : '—'}
                                    </p>
                                    <p className="text-sm text-muted mt-1">
                                        Basé sur tous les étudiants de {user?.filiere} {user?.annee}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] uppercase text-muted">Moyenne de la promo</p>
                                    <p className="font-display text-[34px] tabular-nums">{rankings.overall?.average.toFixed(2) || '—'}</p>
                                </div>
                            </div>

                            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                                {Object.entries(rankings.ues).map(([catName, rankData]) => {
                                    if (!rankData) return null;
                                    return (
                                        <div key={catName} className="rounded-[28px] bg-surface p-5">
                                            <div className="flex justify-between items-start gap-3 pb-2 border-b border-rule">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm">{getCategoryShortName(catName)}</h4>
                                                    <p className="text-xs text-muted mt-0.5">{rankData.total} participants</p>
                                                </div>
                                                <div className="font-display text-xl tabular-nums shrink-0 whitespace-nowrap">
                                                    {rankData.rank}<span className="text-xs">{rankData.rank === 1 ? 'er' : 'ème'}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                {ues.filter(ue => ue.category === catName && ue.semester === selectedSemester).map(ue => {
                                                    const subRank = rankings.subjects[ue.id];
                                                    return (
                                                        <div key={ue.id} className="flex items-center justify-between py-1.5 border-b border-rule last:border-b-0 text-xs">
                                                            <span className="text-muted truncate max-w-[180px]">{ue.nom}</span>
                                                            <span className="tabular-nums shrink-0">{subRank ? `${subRank.rank} / ${subRank.total}` : '—'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-xs text-muted">
                                Les classements sont indicatifs et basés uniquement sur les données saisies par les utilisateurs de l'application.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-[28px] bg-surface p-8 text-center">
                            <p className="text-muted">Ajoutez quelques notes pour voir votre position dans la promo.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Grades;
