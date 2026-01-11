import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const TasksContext = createContext(null);

const STORAGE_KEY = 'personal_tasks';

/**
 * Provider pour gérer les tâches personnelles (examens manuels)
 * Les tâches sont stockées dans Supabase avec fallback localStorage
 */
export const TasksProvider = ({ children }) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Charger les tâches depuis Supabase ou localStorage
    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (user) {
                // Charger depuis Supabase
                const { data, error: fetchError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: true });

                if (fetchError) throw fetchError;
                setTasks(data || []);
            } else {
                // Fallback localStorage
                const stored = localStorage.getItem(STORAGE_KEY);
                setTasks(stored ? JSON.parse(stored) : []);
            }
        } catch (err) {
            console.error('Erreur chargement tâches:', err);
            // Fallback localStorage en cas d'erreur
            const stored = localStorage.getItem(STORAGE_KEY);
            setTasks(stored ? JSON.parse(stored) : []);
            setError('Erreur de synchronisation, mode hors-ligne');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Charger au démarrage et quand user change
    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Ajouter une tâche
    const addTask = useCallback(async (taskData) => {
        const newTask = {
            id: crypto.randomUUID(),
            title: taskData.title,
            date: taskData.date,
            description: taskData.description || '',
            created_at: new Date().toISOString()
        };

        try {
            if (user) {
                const { data, error: insertError } = await supabase
                    .from('tasks')
                    .insert([{ ...newTask, user_id: user.id }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                setTasks(prev => [...prev, data].sort((a, b) => new Date(a.date) - new Date(b.date)));
            } else {
                // Fallback localStorage
                const updated = [...tasks, newTask].sort((a, b) => new Date(a.date) - new Date(b.date));
                setTasks(updated);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            }
            return { success: true };
        } catch (err) {
            console.error('Erreur ajout tâche:', err);
            // Fallback localStorage
            const updated = [...tasks, newTask].sort((a, b) => new Date(a.date) - new Date(b.date));
            setTasks(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return { success: true, offline: true };
        }
    }, [user, tasks]);

    // Supprimer une tâche
    const deleteTask = useCallback(async (taskId) => {
        try {
            if (user) {
                const { error: deleteError } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', taskId)
                    .eq('user_id', user.id);

                if (deleteError) throw deleteError;
            }

            const updated = tasks.filter(t => t.id !== taskId);
            setTasks(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return { success: true };
        } catch (err) {
            console.error('Erreur suppression tâche:', err);
            const updated = tasks.filter(t => t.id !== taskId);
            setTasks(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return { success: true, offline: true };
        }
    }, [user, tasks]);

    // Calculer les jours restants pour chaque tâche
    const tasksWithCountdown = tasks.map(task => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
        return { ...task, daysUntil };
    });

    const value = {
        tasks: tasksWithCountdown,
        loading,
        error,
        addTask,
        deleteTask,
        refreshTasks: loadTasks
    };

    return (
        <TasksContext.Provider value={value}>
            {children}
        </TasksContext.Provider>
    );
};

/**
 * Hook pour accéder aux tâches personnelles
 */
export const useTasks = () => {
    const context = useContext(TasksContext);
    if (!context) {
        throw new Error('useTasks must be used within a TasksProvider');
    }
    return context;
};

export default TasksContext;
