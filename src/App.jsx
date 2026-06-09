import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './shared/components/Layout';
import Home from './features/home/Home';
import Dashboard from './features/dashboard/Dashboard';
import Grades from './features/grades/Grades';
import Schedule from './features/schedule/Schedule';
import Averages from './features/grades/Averages';
import Exams from './features/schedule/Exams';
import RemainingHours from './features/hours/RemainingHours';
import Tasks from './features/tasks/Tasks';
import Calendar from './features/calendar/Calendar';
import Login from './features/auth/Login';
import Onboarding from './features/auth/Onboarding';
import Profile from './features/profile/Profile';
import { ScheduleProvider } from './shared/context/ScheduleContext';
import { TasksProvider } from './shared/context/TasksContext';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import { ToastProvider } from './shared/context/ToastContext';

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading, needsOnboarding } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (needsOnboarding && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return children;
};

function AppContent() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={
                    <ProtectedRoute>
                        <Onboarding />
                    </ProtectedRoute>
                } />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <ScheduleProvider>
                            <TasksProvider>
                                <Layout>
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/schedule" element={<Schedule />} />
                                        <Route path="/dashboard" element={<Dashboard />} />
                                        <Route path="/grades" element={<Grades />} />
                                        <Route path="/averages" element={<Averages />} />
                                        <Route path="/exams" element={<Exams />} />
                                        <Route path="/hours" element={<RemainingHours />} />
                                        <Route path="/tasks" element={<Tasks />} />
                                        <Route path="/calendar" element={<Calendar />} />
                                        <Route path="/profile" element={<Profile />} />
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
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;


