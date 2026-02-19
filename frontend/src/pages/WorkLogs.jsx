import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Send, AlertCircle, CheckCircle2, Info, Clock, User as UserIcon } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const WorkLogs = () => {
    const { user: currentUser } = useAuth();
    const [log, setLog] = useState({ task_id: '', content: '', blockers: '', decisions_made: '', hours_spent: 0, user_id: currentUser?.id || '' });
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (currentUser) {
            setLog(prev => ({ ...prev, user_id: currentUser.id }));
        }
        fetchInitialData();
    }, [currentUser]);

    const fetchInitialData = async () => {
        try {
            const [pRes, uRes, tRes] = await Promise.all([
                api.get('/projects'),
                api.get('/users'),
                api.get('/tasks')
            ]);
            setProjects(pRes.data);
            setUsers(uRes.data);
            setTasks(tRes.data.filter(t => t.status !== 'DONE'));
        } catch (e) {
            console.error("Initial data fetch error", e);
        }
    };

    const handleLog = async (e) => {
        e.preventDefault();
        try {
            await api.post('/logs', log);
            setStatus({ type: 'success', message: 'Insight captured. Knowledge graph updated.' });
            setLog({ task_id: '', content: '', blockers: '', decisions_made: '', hours_spent: 0, user_id: '' });
            setTimeout(() => setStatus(null), 4000);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to sync work log' });
            setTimeout(() => setStatus(null), 5000);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-12 pb-20">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                    <Info size={12} />
                    Ground Truth Capture
                </div>
                <h2 className="text-5xl font-black text-text-main tracking-tight">Daily Work Log</h2>
                <p className="text-lg text-text-muted max-w-xl mx-auto">Document tactical progress, pivot points, and blockers to maintain high-fidelity context.</p>
            </header>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-4 rounded-2xl border flex items-center gap-4 ${status.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}
                    >
                        {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        <p className="font-bold text-sm tracking-wide">{status.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleLog} className="bg-surface/30 p-10 rounded-3xl border border-border shadow-glass space-y-10 group hover:border-primary/20 transition-all">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                            <Clock size={12} /> Work Session
                        </label>
                        <select
                            className="bg-background/80 border border-border rounded-xl px-4 py-3 text-text-main w-full outline-none focus:border-primary transition-all text-sm font-semibold"
                            value={log.task_id}
                            onChange={e => setLog({ ...log, task_id: e.target.value })}
                            required
                        >
                            <option value="">Select Target Task</option>
                            {tasks.map(t => <option key={t.id} value={t.id}>{t.title} (ID-{t.id})</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                            <UserIcon size={12} /> Contributor
                        </label>
                        <select
                            className="bg-background/80 border border-border rounded-xl px-4 py-3 text-text-main w-full outline-none focus:border-primary transition-all text-sm font-semibold"
                            value={log.user_id}
                            onChange={e => setLog({ ...log, user_id: e.target.value })}
                            required
                        >
                            <option value="">Select ID</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2 space-y-2 text-center max-w-xs mx-auto">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2 block">Duration Allocation</label>
                        <input
                            type="number"
                            step="0.5"
                            className="bg-background/80 border border-border rounded-2xl px-6 py-4 text-3xl font-black text-center text-text-main w-full outline-none focus:border-primary transition-all shadow-inner"
                            value={log.hours_spent}
                            onChange={e => setLog({ ...log, hours_spent: e.target.value })}
                            placeholder="0.0"
                            required
                        />
                        <span className="text-[10px] font-bold text-text-muted mt-2 block">HOURS LOGGED</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2 block">Technical Summary</label>
                        <textarea
                            className="bg-background/80 border border-border rounded-2xl px-5 py-4 text-text-main w-full outline-none focus:border-primary transition-all h-32 resize-none leading-relaxed text-sm"
                            value={log.content}
                            onChange={e => setLog({ ...log, content: e.target.value })}
                            placeholder="What did you solve or build today?"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-warning/70 mb-2 block">Friction & Blockers</label>
                            <textarea
                                className="bg-background/80 border border-border rounded-2xl px-5 py-4 text-text-main w-full outline-none focus:border-warning/30 transition-all h-24 resize-none text-sm italic"
                                value={log.blockers}
                                onChange={e => setLog({ ...log, blockers: e.target.value })}
                                placeholder="Any operational or technical blockers?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/70 mb-2 block">Strategic Pivot Points</label>
                            <textarea
                                className="bg-background/80 border border-border rounded-2xl px-5 py-4 text-text-main w-full outline-none focus:border-secondary/30 transition-all h-24 resize-none text-sm italic"
                                value={log.decisions_made}
                                onChange={e => setLog({ ...log, decisions_made: e.target.value })}
                                placeholder="Key architectural decisions made..."
                            />
                        </div>
                    </div>
                </div>

                <button type="submit" className="bg-primary text-white w-full py-5 rounded-2xl text-lg font-black tracking-widest uppercase shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-1 active:translate-y-0.5 flex items-center justify-center gap-4">
                    <Send size={24} />
                    Commit Insight
                </button>
            </form>
        </motion.div>
    );
};

export default WorkLogs;
