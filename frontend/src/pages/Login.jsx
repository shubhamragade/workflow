import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Mail, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/login', credentials);
            login(res.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-surface/30 backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 shadow-2xl relative z-10"
            >
                <div className="text-center mb-10 space-y-4">
                    <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-1.5 rounded-full border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                        <ShieldCheck size={12} />
                        Identity Verification
                    </div>
                    <h1 className="text-4xl font-black text-text-main tracking-tighter">Nexus</h1>
                    <p className="text-text-muted text-sm font-medium">Authenticate to access the strategic intelligence layer.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Quantum Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                className="w-full bg-background/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-text-main outline-none focus:border-primary/50 transition-all placeholder:text-text-muted/30"
                                placeholder="name@company.ai"
                                value={credentials.email}
                                onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Access Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="password"
                                required
                                className="w-full bg-background/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-text-main outline-none focus:border-primary/50 transition-all placeholder:text-text-muted/30"
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-xs font-bold text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-5 rounded-2xl font-black tracking-widest uppercase shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : (
                            <>
                                Initialize Session <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-center gap-2">
                        <Sparkles size={12} className="text-secondary" />
                        Strategic Engineering Platform v1.0
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
