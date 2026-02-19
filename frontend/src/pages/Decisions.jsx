import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Plus, Target, MessageSquare, ArrowUpRight, ShieldCheck, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api';

const Decisions = () => {
    const [decisions, setDecisions] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [status, setStatus] = useState(null);
    const [newDecision, setNewDecision] = useState({ project_id: '', author_id: '', title: '', explanation: '', reasoning: '', impact_level: 'Medium' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dRes, pRes, uRes] = await Promise.all([
                api.get('/decisions'),
                api.get('/projects'),
                api.get('/users')
            ]);
            setDecisions(dRes.data);
            setProjects(pRes.data);
            setUsers(uRes.data);
        } catch (e) {
            console.error("Error fetching decisions", e);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/decisions', newDecision);
            setShowAdd(false);
            setNewDecision({ project_id: '', author_id: '', title: '', explanation: '', reasoning: '', impact_level: 'Medium' });
            setStatus({ type: 'success', message: 'Context preserved in immutable registry.' });
            fetchData();
            setTimeout(() => setStatus(null), 4000);
        } catch (e) {
            setStatus({ type: 'error', message: 'Failed to commit decision.' });
            setTimeout(() => setStatus(null), 5000);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20 max-w-5xl mx-auto">
            <header className="flex justify-between items-end border-b border-border pb-8">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-text-main mb-2">Decision Registry</h2>
                    <p className="text-lg text-text-muted">High-fidelity log of architectural pivots and strategic choices.</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-soft hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    {showAdd ? 'Discard' : 'Log Decision'}
                </button>
            </header>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-2xl border flex items-center gap-4 ${status.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}
                    >
                        {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        <p className="font-bold text-sm tracking-wide">{status.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-surface/50 p-10 rounded-3xl border border-primary/20 shadow-glass overflow-hidden"
                    >
                        <h3 className="text-xl font-bold text-text-main mb-8 flex items-center gap-3">
                            <Plus className="text-primary" />
                            New Context Entry
                        </h3>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <SelectField
                                    label="Scope Project"
                                    value={newDecision.project_id}
                                    onChange={v => setNewDecision({ ...newDecision, project_id: v })}
                                    options={projects.map(p => ({ value: p.id, label: p.name }))}
                                />
                                <SelectField
                                    label="Architect"
                                    value={newDecision.author_id}
                                    onChange={v => setNewDecision({ ...newDecision, author_id: v })}
                                    options={users.map(u => ({ value: u.id, label: u.name }))}
                                />
                                <SelectField
                                    label="Impact Level"
                                    value={newDecision.impact_level}
                                    onChange={v => setNewDecision({ ...newDecision, impact_level: v })}
                                    options={[
                                        { value: 'Low', label: 'Low Impact' },
                                        { value: 'Medium', label: 'Medium Impact' },
                                        { value: 'High', label: 'High Priority' }
                                    ]}
                                />
                            </div>
                            <InputField
                                label="Decision Title"
                                value={newDecision.title}
                                onChange={v => setNewDecision({ ...newDecision, title: v })}
                                placeholder="E.g., Migrating to PostgreSQL for better JSONB support"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <TextareaField
                                    label="The Decision"
                                    value={newDecision.explanation}
                                    onChange={v => setNewDecision({ ...newDecision, explanation: v })}
                                    placeholder="What was decided? Keep it concise."
                                />
                                <TextareaField
                                    label="Reasoning / Trade-offs"
                                    value={newDecision.reasoning}
                                    onChange={v => setNewDecision({ ...newDecision, reasoning: v })}
                                    placeholder="Why was this chosen over alternatives?"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-border">
                                <button type="button" onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-main px-6 py-2 text-sm font-medium transition-colors">Discard</button>
                                <button type="submit" className="bg-primary text-white px-10 py-2.5 rounded-xl text-sm font-black shadow-soft transition-all hover:bg-primary-hover tracking-widest uppercase">Commit Decision</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-6">
                {decisions.map((decision, idx) => (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={decision.id}
                        className="bg-surface/30 p-8 rounded-3xl border border-border group hover:bg-surface/50 transition-all hover:border-primary/20 relative overflow-hidden"
                    >
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${decision.impact_level === 'High' ? 'bg-error' : decision.impact_level === 'Medium' ? 'bg-primary' : 'bg-success'}`} />

                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-text-main group-hover:text-primary transition-colors pr-20">{decision.title}</h3>
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">
                                    <Target size={12} className="text-primary" />
                                    <span>{projects.find(p => p.id === decision.project_id)?.name || 'Global Strategy'}</span>
                                    <span className="opacity-20 mx-1">|</span>
                                    <span>VERIFIED ON {new Date(decision.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${decision.impact_level === 'High' ? 'bg-error/10 border-error/20 text-error' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                {decision.impact_level} IMPACT
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black tracking-widest text-text-muted uppercase mb-2">Abstract</p>
                                <p className="text-sm text-text-main leading-relaxed font-medium">{decision.explanation || "Primary architectural adjustment implemented across target vectors."}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black tracking-widest text-text-muted uppercase mb-2">Reasoning & Context</p>
                                <p className="text-sm text-text-muted leading-relaxed italic">{decision.reasoning}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border group-hover:border-primary/30 transition-all">
                                    <ShieldCheck size={16} className="text-success" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-text-main leading-none mb-0.5">{decision.author?.name || 'Lead Architect'}</p>
                                    <p className="text-[10px] text-text-muted font-bold tracking-tighter uppercase">Verified Decision</p>
                                </div>
                            </div>
                            <ArrowUpRight size={18} className="text-text-muted group-hover:text-text-main transition-colors cursor-pointer" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

const SelectField = ({ label, value, onChange, options }) => (
    <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">{label}</label>
        <select
            className="bg-background border border-border rounded-xl px-4 py-2 text-sm text-text-main w-full outline-none focus:border-primary transition-all cursor-pointer"
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            <option value="">Select Option</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const InputField = ({ label, value, onChange, placeholder }) => (
    <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">{label}</label>
        <input
            type="text"
            className="bg-background border border-border rounded-xl px-4 py-3 text-sm text-text-main w-full outline-none focus:border-primary transition-all"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            required
        />
    </div>
);

const TextareaField = ({ label, value, onChange, placeholder }) => (
    <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">{label}</label>
        <textarea
            className="bg-background border border-border rounded-2xl px-5 py-4 text-sm text-text-main w-full outline-none focus:border-primary transition-all h-32 resize-none leading-relaxed"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            required
        />
    </div>
);

export default Decisions;
