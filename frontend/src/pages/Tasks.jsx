import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    Clock,
    User,
    ArrowRight,
    MoreHorizontal,
    Circle,
    PlayCircle,
    CheckCircle,
    Eye
} from 'lucide-react';
import api from '../api';

import { useAuth } from '../context/AuthContext';

const Tasks = () => {
    const { user: currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newTask, setNewTask] = useState({ project_id: '', title: '', user_id: currentUser?.id || '', priority: 'Medium', description: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUser) {
            setNewTask(prev => ({ ...prev, user_id: currentUser.id }));
        }
        fetchData();
    }, [currentUser]);

    const fetchData = async () => {
        try {
            const [tRes, pRes, uRes] = await Promise.all([api.get('/tasks'), api.get('/projects'), api.get('/users')]);
            setTasks(tRes.data || []);
            setProjects(pRes.data);
            setUsers(uRes.data);
        } catch (e) {
            console.error("Fetch error", e);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', newTask);
            setShowAdd(false);
            setNewTask({ project_id: '', title: '', user_id: '', priority: 'Medium', description: '' });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleComplete = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        try {
            await api.post(`/tasks/${taskId}/complete`, { version_id: task?.version_id });
            fetchData();
        } catch (err) {
            if (err.response?.status === 409) {
                setError('Conflict: Task updated by another user. Refreshing data...');
                fetchData();
            } else {
                setError(err.response?.data?.message || 'Failed to complete task');
            }
            setTimeout(() => setError(''), 5000);
        }
    };

    return (
        <div className="space-y-8 h-full flex flex-col">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-text-main">Execution Board</h2>
                    <p className="text-text-muted">Strictly enforced state transitions for engineering stability.</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2 shadow-soft group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-semibold text-sm">Create Issue</span>
                </button>
            </header>

            {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3 text-error">
                    <AlertCircle size={18} />
                    <p className="font-medium text-sm">{error}</p>
                </motion.div>
            )}

            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-surface/50 p-6 rounded-2xl border border-border shadow-glass space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select
                                className="bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                                value={newTask.project_id}
                                onChange={e => setNewTask({ ...newTask, project_id: e.target.value })}
                                required
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select
                                className="bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                                value={newTask.user_id}
                                onChange={e => setNewTask({ ...newTask, user_id: e.target.value })}
                            >
                                <option value="">Unassigned</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                            <select
                                className="bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                                value={newTask.priority}
                                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                            >
                                <option value="Low">Low Priority</option>
                                <option value="Medium">Medium Priority</option>
                                <option value="High">High Priority</option>
                            </select>
                        </div>
                        <input
                            type="text"
                            placeholder="Issue title..."
                            className="bg-background border border-border rounded-xl px-4 py-2 text-base w-full outline-none focus:border-primary"
                            value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            required
                        />
                        <textarea
                            placeholder="Brief description of the objective..."
                            className="bg-background border border-border rounded-xl px-4 py-2 text-sm w-full outline-none focus:border-primary h-24"
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-main px-4 py-2 text-sm font-medium">Discard</button>
                            <button onClick={handleCreate} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-soft">Create Work Item</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden pb-10">
                <TaskColumn
                    title="Todo"
                    icon={<Circle size={14} className="text-text-muted" />}
                    status="TODO"
                    tasks={tasks}
                    users={users}
                    onComplete={handleComplete}
                />
                <TaskColumn
                    title="In Progress"
                    icon={<PlayCircle size={14} className="text-warning" />}
                    status="IN_PROGRESS"
                    tasks={tasks}
                    users={users}
                    onComplete={handleComplete}
                />
                <TaskColumn
                    title="Review"
                    icon={<Eye size={14} className="text-secondary" />}
                    status="REVIEW"
                    tasks={tasks}
                    users={users}
                    onComplete={handleComplete}
                />
                <TaskColumn
                    title="Done"
                    icon={<CheckCircle size={14} className="text-success" />}
                    status="DONE"
                    tasks={tasks}
                    users={users}
                    onComplete={handleComplete}
                />
            </div>
        </div>
    );
};

const TaskColumn = ({ title, icon, status, tasks, users, onComplete }) => {
    const filteredTasks = tasks.filter(t => t.status === status);

    return (
        <div className="flex flex-col h-full bg-surface/20 rounded-2xl border border-border/50">
            <div className="p-4 flex items-center justify-between border-b border-border/30 mb-2">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="font-bold text-xs uppercase tracking-widest text-text-muted">{title}</h3>
                    <span className="bg-glass px-2 py-0.5 rounded text-[10px] font-bold text-text-muted">{filteredTasks.length}</span>
                </div>
                <MoreHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-main transition-colors" />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filteredTasks.map(task => {
                    const assignee = users.find(u => u.id === task.user_id);
                    const priorityColor = task.priority === 'High' ? 'text-error' : task.priority === 'Medium' ? 'text-primary' : 'text-text-muted';

                    return (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={task.id}
                            className="bg-surface/40 p-4 rounded-xl border border-border group hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${priorityColor}`}>
                                    {task.priority}
                                </span>
                                <span className="text-[10px] font-bold text-text-muted opacity-30 group-hover:opacity-100 transition-opacity">ID-{task.id}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-text-main mb-2 leading-relaxed">{task.title}</h4>

                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md bg-secondary/10 flex items-center justify-center border border-secondary/10">
                                        <User size={10} className="text-secondary" />
                                    </div>
                                    <span className="text-[10px] font-bold text-text-muted">{assignee ? assignee.name : 'Unassigned'}</span>
                                </div>

                                {status !== 'DONE' && (
                                    <button
                                        onClick={() => onComplete(task.id)}
                                        className="p-1.5 rounded-lg bg-glass border border-border text-text-muted hover:border-success/30 hover:text-success transition-all shadow-sm"
                                        title="Advance State (requires work log)"
                                    >
                                        <CheckCircle2 size={14} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {filteredTasks.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border/20 rounded-xl opacity-20">
                        <ClipboardList size={24} />
                        <span className="text-[10px] mt-2 font-bold uppercase tracking-widest">Empty Lane</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tasks;
