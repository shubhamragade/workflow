import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    CheckCircle2,
    Clock,
    Activity,
    Users,
    FolderKanban,
    Lightbulb,
    ArrowUpRight,
    Target,
    ClipboardList
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user: currentUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [decisions, setDecisions] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [teamTasks, setTeamTasks] = useState([]);
    const [stats, setStats] = useState({ totalTasks: 0, doneTasks: 0, totalHours: 0, contributors: 0 });

    const isAdmin = currentUser?.role === 'Admin';

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const fetchData = async () => {
        try {
            const [pRes, dRes, sRes, tRes] = await Promise.all([
                api.get('/projects'),
                api.get('/decisions'),
                api.get('/stats/overview'),
                api.get('/tasks')
            ]);
            setProjects(pRes.data);
            setDecisions(dRes.data);
            setStats(sRes.data);

            if (currentUser && Array.isArray(tRes.data)) {
                if (isAdmin) {
                    setTeamTasks(tRes.data.filter(t => t.status !== 'DONE'));
                } else {
                    setMyTasks(tRes.data.filter(t => t.user_id === currentUser.id && t.status !== 'DONE'));
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-text-main mb-2">Overview</h2>
                    <p className="text-lg text-text-muted">Real-time pulse of project evolution and knowledge capital.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-success/10 px-4 py-2 rounded-full border border-success/20 text-success text-xs font-bold tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                        LIVE TELEMETRY
                    </div>
                </div>
            </header>

            {/* Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<FolderKanban size={20} />} label="Active Projects" value={projects.filter(p => p.status === 'ACTIVE').length} growth="+2 this week" />
                <StatCard icon={<CheckCircle2 size={20} />} label="Tasks Completed" value={stats.doneTasks} growth="+12%" />
                <StatCard icon={<Clock size={20} />} label="Engineering Hours" value={stats.totalHours} growth="Across all tasks" />
                <StatCard icon={<Users size={20} />} label="Active Contributors" value={stats.contributors} growth="Grounded documentation" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution Tracking & Personal tasks */}
                <div className="lg:col-span-2 space-y-10">
                    {(isAdmin ? teamTasks : myTasks).length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-text-main flex items-center gap-3">
                                <ClipboardList className="text-primary" size={20} />
                                {isAdmin ? 'Global Execution Board' : 'My Active Tasks'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(isAdmin ? teamTasks : myTasks).map((task, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={task.id}
                                        className={`p-5 rounded-2xl border transition-all ${isAdmin ? 'bg-surface/40 border-border hover:border-primary/40' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${task.priority === 'High' ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'}`}>
                                                {task.priority}
                                            </span>
                                            <span className="text-[10px] font-bold text-text-muted">ID-{task.id}</span>
                                        </div>
                                        <h4 className="font-bold text-text-main mb-1">{task.title}</h4>
                                        <p className="text-xs text-text-muted mb-4 line-clamp-1">{task.description}</p>
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-text-muted pt-4 border-t border-border/10">
                                            <span>
                                                {isAdmin ? (
                                                    <span className="flex items-center gap-1">
                                                        <Users size={10} className="text-secondary" />
                                                        {task.assignee_name || 'Unassigned'}
                                                    </span>
                                                ) : (
                                                    projects.find(p => p.id === task.project_id)?.name || 'Project'
                                                )}
                                            </span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> {task.status}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-text-main flex items-center gap-3">
                            <Activity className="text-primary" size={20} />
                            Project Evolution
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {projects.map((project, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={project.id}
                                    className="bg-surface/30 p-5 rounded-2xl border border-border group hover:border-primary/40 transition-all hover:bg-surface/50"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-lg text-text-main group-hover:text-primary transition-colors">{project.name}</h4>
                                            <span className="text-xs font-bold tracking-tighter text-text-muted uppercase">STAYING ON PATH</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-text-main">{Math.round(project.completion_percentage)}<span className="text-sm text-text-muted font-normal ml-0.5">%</span></p>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${project.completion_percentage}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-primary to-secondary"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Decisions */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-text-main flex items-center gap-3">
                        <Target className="text-secondary" size={20} />
                        Context Logs
                    </h3>
                    <div className="space-y-4">
                        {decisions.slice(0, 4).map((decision, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={decision.id}
                                className="p-4 rounded-xl border border-border bg-surface/20 flex flex-col gap-3 group hover:bg-surface/40 transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-sm text-text-main line-clamp-1">{decision.title}</p>
                                    <ArrowUpRight size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{decision.reasoning}</p>
                                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest mt-1">
                                    <span className="text-primary">{decision.author?.name || 'Lead Architect'}</span>
                                    <span className="text-text-muted">{new Date(decision.timestamp).toLocaleDateString()}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const StatCard = ({ icon, label, value, growth }) => (
    <div className="bg-surface/30 p-6 rounded-2xl border border-border hover:border-primary/20 transition-all hover:bg-surface/50 group">
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className="text-[10px] font-bold text-success/80 tracking-tighter">{growth}</span>
        </div>
        <div>
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-4xl font-extrabold text-text-main">{value}</p>
        </div>
    </div>
);

export default Dashboard;
