import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKanban, Trash2, ArrowUpRight, Clock, Target } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'Admin';
    const [projects, setProjects] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/projects', newProject);
            setNewProject({ name: '', description: '' });
            setShowAdd(false);
            fetchProjects();
        } catch (error) {
            console.error('Error adding project:', error);
            setError(error.response?.data?.message || 'Failed to initialize project vector.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-text-main mb-2">Projects</h2>
                    <p className="text-lg text-text-muted">High-level visibility into your engineering vectors.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-soft hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        New Project
                    </button>
                )}
            </header>

            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-surface/50 p-8 rounded-3xl border border-primary/20 shadow-glass overflow-hidden"
                    >
                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-text-main">Project Initialization</h3>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-[10px] font-black uppercase tracking-widest text-error bg-error/10 px-3 py-1 rounded-lg border border-error/20"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Project Name</label>
                                    <input
                                        className="bg-background border border-border rounded-xl px-4 py-3 text-text-main w-full outline-none focus:border-primary"
                                        value={newProject.name}
                                        onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                        placeholder="E.g., Context Engine Alpha"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Primary Objective</label>
                                    <textarea
                                        className="bg-background border border-border rounded-xl px-4 py-3 text-text-main w-full outline-none focus:border-primary h-full resize-none"
                                        value={newProject.description}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                        placeholder="Describe the problem this solves..."
                                        rows={1}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button type="button" onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-main px-6 py-2 text-sm font-medium">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary text-white px-8 py-2 rounded-xl text-sm font-bold shadow-soft transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Initializing...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={project.id}
                        className="bg-surface/30 p-8 rounded-3xl border border-border group hover:border-primary/40 transition-all hover:bg-surface/50"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 transition-transform group-hover:scale-105">
                                    <Target size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-text-main group-hover:text-primary transition-colors">{project.name}</h3>
                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-text-muted mt-1">
                                        <span className="flex items-center gap-1"><Clock size={10} /> CREATED {new Date().toLocaleDateString()}</span>
                                        <span className="w-1 h-1 bg-border rounded-full" />
                                        <span className="text-success">{project.status}</span>
                                    </div>
                                </div>
                            </div>
                            <ArrowUpRight size={20} className="text-text-muted group-hover:text-text-main transition-colors cursor-pointer" />
                        </div>

                        <p className="text-sm text-text-muted mb-8 line-clamp-2 leading-relaxed h-11">
                            {project.description || "No strategic objective defined for this orbital path."}
                        </p>

                        <div className="space-y-4 pt-6 border-t border-border">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Evolution Vector</span>
                                <span className="text-lg font-black text-text-main">{project.completion_percentage}%</span>
                            </div>
                            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${project.completion_percentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {projects.length === 0 && (
                <div className="text-center py-24 bg-surface/20 rounded-3xl border border-dashed border-border flex flex-col items-center">
                    <FolderKanban size={56} className="text-text-muted mb-4 opacity-10" />
                    <p className="text-text-muted font-medium">No projects found. Launch your first one!</p>
                </div>
            )}
        </motion.div>
    );
};

export default Projects;
