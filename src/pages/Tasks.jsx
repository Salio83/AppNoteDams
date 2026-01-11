import React, { useState } from 'react';
import { ClipboardList, Calendar, Clock, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { useTasks } from '../context/TasksContext';

const Tasks = () => {
    const { tasks, loading, error, addTask, deleteTask } = useTasks();
    const [showForm, setShowForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [formData, setFormData] = useState({ title: '', date: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const getUrgencyClass = (daysUntil) => {
        if (daysUntil < 0) return 'bg-slate-100 border-slate-300 text-slate-600';
        if (daysUntil <= 3) return 'bg-red-100 border-red-300 text-red-800';
        if (daysUntil <= 7) return 'bg-orange-100 border-orange-300 text-orange-800';
        if (daysUntil <= 14) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        return 'bg-emerald-100 border-emerald-300 text-emerald-800';
    };

    const getUrgencyBadge = (daysUntil) => {
        if (daysUntil < 0) return { text: 'Passé', class: 'bg-slate-500' };
        if (daysUntil <= 3) return { text: 'Urgent', class: 'bg-red-500' };
        if (daysUntil <= 7) return { text: 'Cette semaine', class: 'bg-orange-500' };
        if (daysUntil <= 14) return { text: 'Bientôt', class: 'bg-yellow-500' };
        return { text: 'À venir', class: 'bg-emerald-500' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.date) return;

        setSubmitting(true);
        await addTask(formData);
        setFormData({ title: '', date: '', description: '' });
        setShowForm(false);
        setSubmitting(false);
    };

    const handleDelete = async (taskId, e) => {
        e.stopPropagation();
        await deleteTask(taskId);
    };

    const upcomingTasks = tasks.filter(t => t.daysUntil >= 0);
    const pastTasks = tasks.filter(t => t.daysUntil < 0);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-indigo-500" />
                        Mes Tâches
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Examens et événements personnels (non affichés dans l'emploi du temps)
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Ajouter
                </button>
            </header>

            {error && (
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl flex items-center gap-2 text-sm border border-amber-100">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Formulaire d'ajout */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Nouvelle tâche</h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Titre *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Soutenance de stage"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Date *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description (optionnel)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Notes, lieu, préparation..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {submitting ? 'Ajout...' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        Aucune tâche
                    </h3>
                    <p className="text-slate-500 mb-4">
                        Ajoutez vos examens ou événements avec des dates connues
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter une tâche
                    </button>
                </div>
            ) : (
                <>
                    {/* Tâches à venir */}
                    {upcomingTasks.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                À venir ({upcomingTasks.length})
                            </h3>
                            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                                {upcomingTasks.map((task) => {
                                    const urgency = getUrgencyBadge(task.daysUntil);
                                    return (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${getUrgencyClass(task.daysUntil)}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${urgency.class}`}>
                                                            {urgency.text}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base font-bold mb-1 truncate">{task.title}</h3>
                                                    <p className="flex items-center gap-1 text-sm opacity-80">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.date).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-2xl font-bold">J-{task.daysUntil}</p>
                                                    <button
                                                        onClick={(e) => handleDelete(task.id, e)}
                                                        className="mt-1 p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tâches passées */}
                    {pastTasks.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                Passées ({pastTasks.length})
                            </h3>
                            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 opacity-60">
                                {pastTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`rounded-xl border-2 p-4 ${getUrgencyClass(task.daysUntil)}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold mb-1 truncate line-through">{task.title}</h3>
                                                <p className="flex items-center gap-1 text-sm opacity-80">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(task.date).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long'
                                                    })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(task.id, e)}
                                                className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSelectedTask(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`p-4 ${getUrgencyClass(selectedTask.daysUntil)} border-b-2`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${getUrgencyBadge(selectedTask.daysUntil).class}`}>
                                            {getUrgencyBadge(selectedTask.daysUntil).text}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg">{selectedTask.title}</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Countdown */}
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <p className="text-5xl font-bold text-slate-800">
                                    {selectedTask.daysUntil < 0 ? 'Passé' : `J-${selectedTask.daysUntil}`}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {selectedTask.daysUntil < 0 ? 'depuis' : 'jours restants'}
                                </p>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">
                                        {new Date(selectedTask.date).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(selectedTask.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedTask.description && (
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="font-semibold text-slate-800 mb-1">Notes</p>
                                    <p className="text-sm text-slate-600">{selectedTask.description}</p>
                                </div>
                            )}

                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    handleDelete(selectedTask.id, e);
                                    setSelectedTask(null);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Supprimer cette tâche
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
