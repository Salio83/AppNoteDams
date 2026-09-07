import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { useUEConfig } from '../../shared/hooks/useUEConfig';
import { getCategoryShortName } from '../../shared/utils/colors';
import { GradesSetupGuide } from '../../shared/components/SetupGuide';

const Averages = () => {
    const { user } = useAuth();
    const [grades, setGrades] = useState([]);
    const { ues, hasUEConfig } = useUEConfig();
    const [selectedSemester, setSelectedSemester] = useState(1);

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
                console.error('Erreur chargement:', error);
            }
        };
        loadGrades();
    }, [user]);

    const groupedData = useMemo(() => {
        const semesterUEs = ues.filter(ue => ue.semester === selectedSemester);
        const ueByCat = semesterUEs.reduce((acc, ue) => {
            const cat = ue.category || 'Autres';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(ue);
            return acc;
        }, {});

        return Object.entries(ueByCat).map(([category, ueList]) => {
            const uesWithStats = ueList.map(ue => {
                const subjectGrades = grades.filter(g => g.ue_id === ue.id);
                if (subjectGrades.length === 0) return { ...ue, average: null };
                const sumCoefs = subjectGrades.reduce((sum, g) => sum + g.coef, 0);
                const sumWeighted = subjectGrades.reduce((sum, g) => sum + (g.value * g.coef), 0);
                return { ...ue, average: parseFloat((sumWeighted / sumCoefs).toFixed(2)) };
            });

            const validSubjects = uesWithStats.filter(u => u.average !== null);
            let ueaverage = null;
            if (validSubjects.length > 0) {
                const totalCoef = validSubjects.reduce((sum, u) => sum + u.coef_ue, 0);
                const totalWeighted = validSubjects.reduce((sum, u) => sum + (u.average * u.coef_ue), 0);
                ueaverage = parseFloat((totalWeighted / totalCoef).toFixed(2));
            }

            return { category, ueAverage: ueaverage, subjects: uesWithStats };
        });
    }, [grades, ues, selectedSemester]);

    const semesterAverage = useMemo(() => {
        const withAvg = groupedData.filter(g => g.ueAverage !== null);
        if (withAvg.length === 0) return null;
        const total = withAvg.reduce((sum, g) => sum + g.ueAverage, 0);
        return parseFloat((total / withAvg.length).toFixed(2));
    }, [groupedData]);

    if (!hasUEConfig) {
        return (
            <div className="space-y-6">
                <header>
                    <h2 className="font-display text-2xl">Moyennes</h2>
                    <p className="text-muted">Vue d'ensemble par Unité d'Enseignement</p>
                </header>
                <GradesSetupGuide />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl">Moyennes</h2>
                <p className="font-display text-[34px] tabular-nums">{semesterAverage !== null ? semesterAverage : '—'}</p>
            </header>

            <div className="flex items-center gap-4 text-sm">
                {[1, 2].map(sem => (
                    <button
                        key={sem}
                        onClick={() => setSelectedSemester(sem)}
                        style={{ fontWeight: selectedSemester === sem ? 700 : 400 }}
                        className={selectedSemester === sem ? '' : 'opacity-55 hover:opacity-100'}
                    >
                        Semestre {sem}
                    </button>
                ))}
            </div>

            <div className="space-y-8">
                {groupedData.map(group => (
                    <div key={group.category}>
                        <div className="flex items-baseline justify-between pb-2 border-b border-rule">
                            <h3 className="font-display text-[22px]">{getCategoryShortName(group.category)}</h3>
                            <span className="text-sm text-muted">
                                moyenne {group.ueAverage !== null ? group.ueAverage.toFixed(2) : '—'}
                            </span>
                        </div>
                        {group.subjects.map(subject => (
                            <div key={subject.id} className="flex items-center justify-between py-3 border-b border-rule">
                                <span>{subject.nom}</span>
                                <span
                                    className="font-semibold tabular-nums"
                                    style={subject.average === null ? { color: 'var(--muted)' } : subject.average < 10 ? { color: 'var(--accent)' } : undefined}
                                >
                                    {subject.average !== null ? subject.average : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Averages;
