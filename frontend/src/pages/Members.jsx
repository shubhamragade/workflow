import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Clock, ShieldAlert, Sparkles, Plus, Mail, ShieldCheck, ClipboardList, Lightbulb, Users, Target, ChevronRight } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Members = () => {
    const { user: currentUser } = useAuth();
    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [handover, setHandover] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Member', password: 'password123' });
    const [assignData, setAssignData] = useState({ user_id: '', project_id: '', role: 'Contributor' });
    const [status, setStatus] = useState(null);

    useEffect(() => {
        fetchMembers();
        fetchProjects();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await api.get('/users');
            setMembers(res.data);
        } catch (e) {
            console.error("Failed to fetch members");
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (e) {
            console.error("Failed to fetch projects");
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', newMember);
            setShowAdd(false);
            setNewMember({ name: '', email: '', role: 'Member', password: 'password123' });
            setStatus({ type: 'success', message: 'Identity initialized. Contributor added to grid.' });
            fetchMembers();
            setTimeout(() => setStatus(null), 4000);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to initialize identity.' });
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${assignData.project_id}/members`, { user_id: assignData.user_id, role: assignData.role });
            setAssignData({ user_id: '', project_id: '', role: 'Contributor' });
            setStatus({ type: 'success', message: 'Assignment finalized. Access granted.' });
            setTimeout(() => setStatus(null), 4000);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Assignment failed.' });
        }
    };

    const fetchProfile = async (id) => {
        try {
            const res = await api.get(`/users/${id}/profile`);
            setSelectedProfile(res.data);
        } catch (e) {
            console.error("Failed to fetch profile");
        }
    };

    const toggleStatus = async (member) => {
        const newStatus = member.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await api.patch(`/users/${member.id}/status`, { status: newStatus });
            fetchMembers();
            if (newStatus === 'Inactive') {
                generateHandover(member.id);
            }
        } catch (e) {
            console.error("Failed to update status");
        }
    };

    const generateHandover = async (id) => {
        setLoading(true);
        try {
            const res = await api.post(`/users/${id}/handover`);
            setHandover(res.data);
        } catch (e) {
            console.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = currentUser?.role === 'Admin';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20 max-w-6xl mx-auto">
            <header className="flex justify-between items-end border-b border-border pb-8">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-text-main mb-2">Team Intelligence</h2>
                    <p className="text-lg text-text-muted">Monitor individual impact vectors and manage automated handover protocols.</p>
                </div>
                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <button
                            onClick={() => setShowAdd(!showAdd)}
                            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-soft"
                        >
                            <Plus size={18} /> Add Contributor
                        </button>
                    )}
                    <div className="bg-glass px-4 py-2 rounded-xl border border-border flex items-center gap-3">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-text-main tracking-widest">{members.length} CONTRIBUTORS</span>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-2xl border flex items-center gap-4 ${status.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}
                    >
                        {status.type === 'success' ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                        <p className="font-bold text-sm tracking-wide">{status.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAdd && isAdmin && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-surface/50 p-10 rounded-3xl border border-primary/20 shadow-glass overflow-hidden"
                    >
                        <form onSubmit={handleAddMember} className="space-y-6">
                            <h3 className="text-xl font-black text-text-main uppercase tracking-widest">Initialization Protocol</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-text-muted ml-1">Full Name</label>
                                    <input
                                        className="bg-background border border-border rounded-xl px-4 py-3 text-text-main w-full outline-none focus:border-primary"
                                        value={newMember.name}
                                        onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-text-muted ml-1">Quantum email</label>
                                    <input
                                        type="email"
                                        className="bg-background border border-border rounded-xl px-4 py-3 text-text-main w-full outline-none focus:border-primary"
                                        value={newMember.email}
                                        onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-text-muted ml-1">Primary Role</label>
                                    <select
                                        className="bg-background border border-border rounded-xl px-4 py-3 text-text-main w-full outline-none focus:border-primary"
                                        value={newMember.role}
                                        onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                                    >
                                        <option value="Member">Member</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5 flex items-end">
                                    <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-all tracking-widest uppercase text-xs shadow-soft">
                                        Confirm Entry
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {isAdmin && (
                <div className="bg-surface/20 p-8 rounded-3xl border border-border shadow-inner">
                    <form onSubmit={handleAssign} className="flex flex-col md:flex-row items-end gap-6">
                        <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1 flex items-center gap-2">
                                <Users size={12} /> Target Contributor
                            </label>
                            <select
                                className="bg-background border border-border rounded-xl px-4 py-3 text-text-main w-full outline-none focus:border-primary"
                                value={assignData.user_id}
                                onChange={e => setAssignData({ ...assignData, user_id: e.target.value })}
                                required
                            >
                                <option value="">Select ID</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1 flex items-center gap-2">
                                <Target size={12} /> Assignment Vector (Project)
                            </label>
                            <select
                                className="bg-background border border-border rounded-xl px-4 py-3 text-text-main w-full outline-none focus:border-primary"
                                value={assignData.project_id}
                                onChange={e => setAssignData({ ...assignData, project_id: e.target.value })}
                                required
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="bg-secondary text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-secondary/80 transition-all shadow-soft flex items-center gap-3">
                            Execute Assignment <ChevronRight size={16} />
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {members.map((member, idx) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={member.id}
                        className="bg-surface/30 p-6 rounded-3xl border border-border group hover:bg-surface/50 transition-all hover:border-primary/20 flex flex-col md:flex-row justify-between items-center gap-6"
                    >
                        <div className="flex items-center gap-6 flex-1 w-full">
                            <div className="relative">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${member.status === 'Active' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-text-muted/10 border-border text-text-muted'}`}>
                                    <User size={32} />
                                </div>
                                {member.status === 'Active' && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-2 border-background rounded-full" />}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-text-main flex items-center gap-3">
                                    {member.name}
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-glass border border-border text-text-muted uppercase font-black tracking-widest">{member.role}</span>
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-text-muted font-medium">
                                    <span className="flex items-center gap-1.5"><Mail size={14} /> {member.email}</span>
                                    <span className="text-border">|</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {member.projects?.length > 0 ? (
                                            member.projects.map((p, pidx) => (
                                                <span key={pidx} className="bg-primary/5 text-primary text-[9px] px-2 py-0.5 rounded-full border border-primary/10 font-bold uppercase">{p}</span>
                                            ))
                                        ) : (
                                            <span className="text-[9px] italic opacity-50">No Projects Assigned</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchProfile(member.id)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text-main hover:bg-glass transition-all border border-transparent hover:border-border"
                            >
                                View Analytics
                            </button>
                            <button
                                onClick={() => toggleStatus(member)}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${member.status === 'Active' ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-success/10 text-success hover:bg-success/20'}`}
                            >
                                {member.status === 'Active' ? 'Suspend' : 'Reinstate'}
                            </button>
                            {member.status === 'Inactive' && (
                                <button
                                    onClick={() => generateHandover(member.id)}
                                    className="bg-secondary text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-soft hover:bg-secondary/80 transition-all"
                                >
                                    <Sparkles size={14} />
                                    Recover Context
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedProfile && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-surface/50 p-10 rounded-3xl border border-primary/20 shadow-glass space-y-8"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black text-text-main">Performance Metrics</h3>
                            <button onClick={() => setSelectedProfile(null)} className="text-text-muted hover:text-text-main text-xs font-bold uppercase tracking-widest">Close Access</button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <ProfileStat label="Work Items Completed" value={selectedProfile.tasksDone} icon={<Activity size={20} className="text-success" />} />
                            <ProfileStat label="Engineering Hours" value={selectedProfile.totalHours} icon={<Clock size={20} className="text-warning" />} />
                            <ProfileStat label="Critical Decisions" value={selectedProfile.decisionsMade} icon={<Lightbulb size={20} className="text-primary" />} />
                            <ProfileStat label="Context Entries" value={selectedProfile.logsCreated} icon={<ClipboardList size={20} className="text-secondary" />} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {handover && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-surface/50 p-10 rounded-3xl border border-secondary/30 space-y-8 shadow-glass"
                    >
                        <div className="flex justify-between items-center border-b border-border pb-6">
                            <div className="flex items-center gap-4 text-secondary uppercase font-black tracking-[0.3em] text-sm">
                                <ShieldAlert size={24} />
                                Handover Protocol Active
                            </div>
                            <span className="text-[10px] font-black bg-secondary/20 text-secondary px-3 py-1 rounded-full uppercase">{handover.type} REPORT</span>
                        </div>

                        <div className="p-8 bg-background/50 rounded-2xl border border-border space-y-6">
                            <p className="text-text-main whitespace-pre-line leading-relaxed text-sm font-medium">
                                {handover.summary}
                            </p>
                            <div className="flex justify-between items-center pt-6 border-t border-border/30 text-[10px] font-black text-text-muted uppercase tracking-widest">
                                <span>AUTHENTICATED Context GAIN</span>
                                <span>TIMESTAMP: {new Date().toLocaleString()}</span>
                            </div>
                        </div>

                        <button onClick={() => setHandover(null)} className="w-full bg-glass py-4 rounded-xl text-xs font-black text-text-main uppercase tracking-widest hover:bg-surface transition-all">TERMINATE VIEW</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ProfileStat = ({ label, value, icon }) => (
    <div className="bg-background/40 p-6 rounded-2xl border border-border group hover:border-white/10 transition-all">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-glass flex items-center justify-center border border-border">
                {icon}
            </div>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-3xl font-black text-text-main tracking-tight">{value}</p>
    </div>
);

export default Members;
