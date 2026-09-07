import React, { useState } from 'react';
import { useTasks } from '../../shared/context/TasksContext';

const getStatus = (daysUntil) => {
    if (daysUntil < 0) return { label: 'Passé', urgent: false };
    if (daysUntil <= 3) return { label: 'Urgent', urgent: true };
    if (daysUntil <= 7) return { label: 'Cette semaine', urgent: false };
    if (daysUntil <= 14) return { label: 'Bientôt', urgent: false };
    return { label: 'À venir', urgent: false };
};

const TaskRow = ({ task, onDelete, faded }) => {
    const status = getStatus(task.daysUntil);
    return (
        <div className={`flex items-center gap-4 py-3 border-b border-rule ${faded ? 'opacity-60' : ''}`}>
            <span className="font-display text-[24px] tabular-nums shrink-0" style={{ minWidth: 64 }}>
                {task.daysUntil < 0 ? '—' : `J-${task.daysUntil}`}
            </span>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{task.title}</p>
                <p className="text-sm text-muted truncate">
                    {new Date(task.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
            <span
                className="text-[13px] uppercase shrink-0"
                style={status.urgent ? { color: 'var(--accent)' } : { color: 'var(--muted)' }}
            >
                {status.label}
            </span>
            <button onClick={() => onDelete(task.id)} className="opacity-60 hover:opacity-100 shrink-0" title="Supprimer">
                ×
            </button>
        </div>
    );
};

const Tasks = () => {
    const { tasks, loading, error, addTask, deleteTask } = useTasks();
    const [formData, setFormData] = useState({ title: '', date: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.date) return;
        setSubmitting(true);
        await addTask(formData);
        setFormData({ title: '', date: '', description: '' });
        setSubmitting(false);
    };

    const handleDelete = async (taskId) => {
        await deleteTask(taskId);
    };

    const upcomingTasks = tasks.filter(t => t.daysUntil >= 0);
    const pastTasks = tasks.filter(t => t.daysUntil < 0);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="font-display text-2xl">Tâches</h2>
                <p className="text-muted text-sm mt-1">Examens et événements personnels</p>
            </header>

            {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}

            <form onSubmit={handleSubmit} className="rounded-[28px] bg-surface p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-[12px] text-muted mb-1.5">Intitulé</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Soutenance de stage"
                            className="w-full bg-bg rounded-full text-sm py-2.5 px-4"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] text-muted mb-1.5">Échéance</label>
                        <input
                            type="datetime-local"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-bg rounded-full text-sm py-2.5 px-4"
                            required
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
                        style={{ background: 'var(--accent-solid)', color: 'var(--bg)' }}
                    >
                        {submitting ? 'Ajout…' : 'Ajouter'}
                    </button>
                </div>
            </form>

            {loading ? (
                <p className="text-muted text-sm">Chargement…</p>
            ) : tasks.length === 0 ? (
                <div className="rounded-[28px] bg-surface p-8 text-center">
                    <p className="text-muted">Aucune tâche pour l'instant.</p>
                </div>
            ) : (
                <>
                    {upcomingTasks.length > 0 && (
                        <div>
                            <h3 className="font-display text-[22px] pb-2 border-b border-rule">À venir</h3>
                            {upcomingTasks.map(task => (
                                <TaskRow key={task.id} task={task} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}

                    {pastTasks.length > 0 && (
                        <div>
                            <h3 className="font-display text-[22px] pb-2 border-b border-rule">Passées</h3>
                            {pastTasks.map(task => (
                                <TaskRow key={task.id} task={task} onDelete={handleDelete} faded />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Tasks;
