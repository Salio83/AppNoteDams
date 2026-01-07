import React, { useEffect, useState } from 'react';
import DashboardStats from '../components/DashboardStats';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { calculateGlobalAverage, getUEStatistics } from '../utils/calculations';
import ues from '../../config_ue.json';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        globalAverage: null,
        bestSubject: null,
        ueStats: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('grades')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) throw error;

                const grades = data.map(g => ({
                    id: g.id,
                    ue_id: g.ue_id,
                    value: parseFloat(g.value),
                    coef: parseFloat(g.coef)
                }));

                const globalAvg = calculateGlobalAverage(grades, ues);
                const ueStats = getUEStatistics(grades, ues);

                const activeUEs = ueStats.filter(u => u.average !== null);
                const bestSubject = activeUEs.length > 0
                    ? activeUEs.reduce((prev, current) => (prev.average > current.average) ? prev : current)
                    : null;

                setStats({
                    globalAverage: globalAvg,
                    bestSubject,
                    ueStats
                });
            } catch (error) {
                console.error('Erreur chargement stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [user]);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord</h2>
                <p className="text-gray-500">Aperçu de vos performances académiques</p>
            </header>

            <DashboardStats
                globalAverage={stats.globalAverage}
                bestSubject={stats.bestSubject}
                ueStats={stats.ueStats}
            />
        </div>
    );
};

export default Dashboard;
