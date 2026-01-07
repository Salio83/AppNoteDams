import React, { useEffect, useState } from 'react';
import DashboardStats from '../components/DashboardStats';
import { getStoredGrades } from '../utils/storage';
import { calculateGlobalAverage, getUEStatistics } from '../utils/calculations';
import ues from '../../config_ue.json';

const Dashboard = () => {
    const [stats, setStats] = useState({
        globalAverage: null,
        bestSubject: null,
        ueStats: []
    });

    useEffect(() => {
        const grades = getStoredGrades();
        const globalAvg = calculateGlobalAverage(grades, ues);
        const ueStats = getUEStatistics(grades, ues);

        // Find best subject with at least one grade
        const activeUEs = ueStats.filter(u => u.average !== null);
        const bestSubject = activeUEs.length > 0
            ? activeUEs.reduce((prev, current) => (prev.average > current.average) ? prev : current)
            : null;

        setStats({
            globalAverage: globalAvg,
            bestSubject,
            ueStats
        });
    }, []);

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
