import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import Schedule from './pages/Schedule';
import Averages from './pages/Averages';
import Exams from './pages/Exams';
import RemainingHours from './pages/RemainingHours';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import { ScheduleProvider } from './context/ScheduleContext';
import { TasksProvider } from './context/TasksContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function AppContent() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <ScheduleProvider>
                            <TasksProvider>
                                <Layout>
                                    <Routes>
                                        <Route path="/" element={<Schedule />} />
                                        <Route path="/dashboard" element={<Dashboard />} />
                                        <Route path="/grades" element={<Grades />} />
                                        <Route path="/averages" element={<Averages />} />
                                        <Route path="/exams" element={<Exams />} />
                                        <Route path="/hours" element={<RemainingHours />} />
                                        <Route path="/tasks" element={<Tasks />} />
                                        <Route path="/calendar" element={<Calendar />} />
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </Layout>
                            </TasksProvider>
                        </ScheduleProvider>
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;


