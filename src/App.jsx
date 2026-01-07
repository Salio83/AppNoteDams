import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import Schedule from './pages/Schedule';
import Averages from './pages/Averages';
import Exams from './pages/Exams';
import RemainingHours from './pages/RemainingHours';
import { ScheduleProvider } from './context/ScheduleContext';

function App() {
    return (
        <ScheduleProvider>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/grades" element={<Grades />} />
                        <Route path="/averages" element={<Averages />} />
                        <Route path="/schedule" element={<Schedule />} />
                        <Route path="/exams" element={<Exams />} />
                        <Route path="/hours" element={<RemainingHours />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            </Router>
        </ScheduleProvider>
    );
}

export default App;


