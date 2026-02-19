import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BarChart3, Clock, Users, ArrowRight } from 'lucide-react';
import api from '../api';

import ReactMarkdown from 'react-markdown';

const Summaries = () => {
    const [reportType, setReportType] = useState('daily');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');

    React.useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects');
                setProjects(res.data);
                if (res.data.length > 0) setSelectedProject(res.data[0].id);
            } catch (e) {
                console.error("Failed to fetch projects");
            }
        };
        fetchProjects();
    }, []);

    const generateSummary = async () => {
        if (!selectedProject) return;
        setLoading(true);
        try {
            const res = await api.post(`/projects/${selectedProject}/summary`, { type: reportType });
            setSummary(res.data);
        } catch (e) {
            console.error('Failed to generate summary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <Sparkles className="text-primary" />
                        AI Status Reports
                    </h2>
                    <p className="text-text-muted">Automated insights derived from your project activity logs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Project:</span>
                    <select
                        className="input bg-glass border-border rounded-xl px-4 py-2"
                        value={selectedProject}
                        onChange={(e) => {
                            setSelectedProject(e.target.value);
                            setSummary(null);
                        }}
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-4 gap-4">
                <ReportToggle active={reportType === 'daily'} onClick={() => setReportType('daily')} icon={<Clock size={20} />} label="Daily Summary" />
                <ReportToggle active={reportType === 'weekly'} onClick={() => setReportType('weekly')} icon={<BarChart3 size={20} />} label="Weekly Recap" />
                <ReportToggle active={reportType === 'contributor_impact'} onClick={() => setReportType('contributor_impact')} icon={<Users size={20} />} label="Contributor Impact" />
                <ReportToggle active={reportType === 'handover'} onClick={() => setReportType('handover')} icon={<ArrowRight size={20} />} label="Handover Docs" />
            </div>

            <div className="glass-effect p-8 rounded-3xl min-h-[400px] flex flex-col items-center justify-center text-center border border-primary/10">
                {!summary && !loading && (
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                            <Sparkles size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Ready to analyze</h3>
                            <p className="text-text-muted max-w-sm">
                                AI will process your work logs and decisions to generate a structured
                                <span className="text-primary font-bold"> {reportType.replace('_', ' ')} </span> report.
                            </p>
                        </div>
                        <button onClick={generateSummary} className="btn btn-primary px-8" disabled={!selectedProject}>
                            Generate Report
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="space-y-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-text-muted animate-pulse">AI is distilling project context...</p>
                    </div>
                )}

                {summary && !loading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full text-left space-y-6"
                    >
                        <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/20">
                            <div className="flex items-center gap-3">
                                <Sparkles size={20} className="text-primary" />
                                <span className="font-bold">AI-Generated {reportType.replace('_', ' ').toUpperCase()} Report</span>
                            </div>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md font-semibold tracking-wider">DERIVED</span>
                        </div>

                        <div className="prose prose-invert max-w-none space-y-4">
                            <div className="p-6 bg-glass rounded-2xl border border-border text-sm leading-relaxed markdown-content">
                                <ReactMarkdown>{summary.summary}</ReactMarkdown>
                            </div>
                        </div>
                        <button onClick={() => setSummary(null)} className="btn btn-outline">Generate New Report</button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const ReportToggle = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${active
            ? 'glass-effect border-primary/50 text-primary shadow-lg shadow-primary/10'
            : 'border-border text-text-muted hover:border-text-muted'
            }`}
    >
        {icon}
        <span className="text-sm font-semibold">{label}</span>
    </button>
);

const CheckCircle2 = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

const AlertCircle = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);

export default Summaries;
