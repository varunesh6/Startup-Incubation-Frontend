import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, Activity, TrendingUp, Code, CheckCircle, X, Calendar, Clock } from 'lucide-react';

const CountdownTimer = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!deadline) return;

        const targetDate = new Date(deadline).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                setIsExpired(true);
                setTimeLeft('Deadline Passed');
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            let timeString = '';
            if (days > 0) timeString += `${days}d `;
            timeString += `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

            setTimeLeft(timeString);
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [deadline]);

    return (
        <span style={{
            color: isExpired ? '#ef4444' : '#f59e0b',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontWeight: 600,
            fontFamily: 'monospace',
            background: isExpired ? '#fef2f2' : '#fffbeb',
            padding: '2px 6px',
            borderRadius: '4px'
        }}>
            <Clock size={14} /> {timeLeft}
        </span>
    );
};

const DeveloperDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();

    // Check if mentor is viewing a specific developer
    const queryParams = new URLSearchParams(location.search);
    const viewingDeveloperId = queryParams.get('developer_id');

    // Modals
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [extensionModalOpen, setExtensionModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // Forms
    const [extensionReason, setExtensionReason] = useState('');
    const [submitForm, setSubmitForm] = useState({ github_link: '' });
    const [fileInput, setFileInput] = useState(null);

    // Project History Modal
    const [projectHistoryModalOpen, setProjectHistoryModalOpen] = useState(false);
    const [selectedProjectHistory, setSelectedProjectHistory] = useState(null);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            let url = '/developer/tasks';
            if (viewingDeveloperId) {
                url += `?developer_id=${viewingDeveloperId}`;
            }
            const tasksRes = await api.get(url);
            setTasks(tasksRes.data.data);
        } catch (error) {
            console.error('Failed to fetch developer data', error);
        }
    };



    const openSubmitModal = (task) => {
        setSelectedTask(task);
        setSubmitForm({ github_link: '' });
        setFileInput(null);
        setSubmitModalOpen(true);
    };

    const openExtensionModal = (task) => {
        setSelectedTask(task);
        setExtensionReason('');
        setExtensionModalOpen(true);
    };

    const handleSubmitProgress = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('github_link', submitForm.github_link);
            if (fileInput) {
                formData.append('work_completion_file', fileInput);
            }

            // Using fetch or axios with the correct content type header for FormData
            await api.put(`/developer/tasks/${selectedTask.id}/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Progress submitted for review!');
            setSubmitModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit progress');
        }
    };

    const handleRequestExtension = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/developer/tasks/${selectedTask.id}/extend`, { reason: extensionReason });
            alert('Extension requested successfully!');
            setExtensionModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to request extension');
        }
    };

    const activeTasksCount = tasks.filter(t => t.status === 'Assigned' || t.status === 'Changes Requested').length;
    // Updates submitted are 'Submitted' or 'Completed'
    const submittedCount = tasks.filter(t => t.status === 'Submitted' || t.status === 'Completed').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    // Group tasks into active projects (Startup)
    const activeProjectsMap = new Map();
    tasks.forEach(task => {
        const key = task.startup_id;
        if (!activeProjectsMap.has(key)) {
            activeProjectsMap.set(key, {
                startup_id: task.startup_id,
                startup_title: task.startup_title,
                tasks: []
            });
        }
        activeProjectsMap.get(key).tasks.push(task);
    });

    const activeProjects = Array.from(activeProjectsMap.values()).map(project => {
        project.tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latestTask = project.tasks[0];
        project.latest_status = latestTask ? latestTask.status : 'Unknown';
        project.pending_action = project.tasks.some(t => t.status !== 'Completed' && t.status !== 'Submitted');

        // Find the most recent active/pending task for direct actions
        project.activeTask = project.tasks.find(t => t.status !== 'Completed' && t.status !== 'Submitted');

        return project;
    });

    // Pie Chart Data
    const statusCounts = tasks.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});

    const pieData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
    }));

    const STATUS_COLORS = {
        'Assigned': '#3b82f6',
        'Submitted': '#f59e0b',
        'Changes Requested': '#ef4444',
        'Completed': '#10b981'
    };

    // Bar Chart Data (Tasks per Startup)
    const startupCounts = tasks.reduce((acc, curr) => {
        const title = curr.startup_title || 'Unknown';
        acc[title] = (acc[title] || 0) + 1;
        return acc;
    }, {});

    const barData = Object.keys(startupCounts).map(title => ({
        name: title,
        Total: startupCounts[title]
    }));

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '2rem' }}>
            <Navbar subtitle={viewingDeveloperId ? "Developer Dashboard (Read-Only View)" : "Developer Dashboard"} />
            <div className="dashboard-container-light">
                <header className="dashboard-header-light" style={{ paddingBottom: '1rem', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 className="dashboard-header-light-title" style={{ color: '#10b981' }}>
                            {viewingDeveloperId ? "Developer's Assigned Projects" : "Developer Dashboard"}
                        </h2>
                        <p style={{ color: '#64748b' }}>
                            {viewingDeveloperId ?
                                <span>Overview of progress <button onClick={() => navigate('/mentor')} style={{ marginLeft: '10px', padding: '2px 8px', borderRadius: '4px', background: '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Back to Mentor Dashboard</button></span>
                                : "Track your assigned projects and progress"
                            }
                        </p>
                    </div>
                </header>

                {/* Statistics Cards */}
                <div className="top-stats-row">
                    <div className="stat-card-light border-blue">
                        <div className="stat-header">
                            <Code size={16} color="#3B82F6" /> Active Projects
                        </div>
                        <div className="stat-val" style={{ color: '#3B82F6' }}>{activeTasksCount}</div>
                        <div className="stat-desc">Working on</div>
                    </div>

                    <div className="stat-card-light border-purple">
                        <div className="stat-header">
                            <TrendingUp size={16} color="#A855F7" /> Updates Submitted
                        </div>
                        <div className="stat-val" style={{ color: '#A855F7' }}>{submittedCount}</div>
                        <div className="stat-desc">Total progress</div>
                    </div>

                    <div className="stat-card-light border-green">
                        <div className="stat-header">
                            <CheckCircle size={16} color="#10B981" /> Completed Projects
                        </div>
                        <div className="stat-val" style={{ color: '#10B981' }}>{completedCount}</div>
                        <div className="stat-desc">Finished successfully</div>
                    </div>
                </div>

                {/* Charts Row */}
                {tasks.length > 0 && (
                    <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div className="chart-card-light" style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: '#1e293b' }}>
                                <Activity size={18} color="#10B981" /> Project Statuses
                            </h4>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={100}
                                            dataKey="value"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} stroke="#ffffff" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card-light" style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: '#10B981' }}>
                                <Briefcase size={18} color="#10B981" /> Projects per Startup
                            </h4>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="Total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Active Projects (Tasks) Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
                    <Code size={20} color="#2563eb" /> My Active Tasks ({tasks.length})
                </div>

                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: tasks.length === 0 ? '4rem 2rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '2.5rem' }}>
                    {tasks.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                                <Code size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0, marginBottom: '0.5rem' }}>No active tasks yet</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Browse available startups below to apply!</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>{task.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Startup: <strong>{task.startup_title}</strong></p>
                                    </div>
                                    <span className={`badge-${task.status.toLowerCase().replace(' ', '-')}-light`} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px' }}>
                                        {task.status}
                                    </span>
                                </div>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>{task.description}</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem' }}>
                                            <Calendar size={14} /> Deadline: {new Date(task.deadline).toLocaleDateString()}
                                            {task.status !== 'Completed' && task.status !== 'Submitted' && (
                                                <span style={{ margin: '0 0.5rem', color: '#cbd5e1' }}>|</span>
                                            )}
                                            {task.status !== 'Completed' && task.status !== 'Submitted' && (
                                                <CountdownTimer deadline={task.deadline} />
                                            )}
                                        </div>
                                        {task.extension_requested && (
                                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
                                                Extension Requested
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                const projectTasks = tasks.filter(t => t.startup_id === task.startup_id);
                                                setSelectedProjectHistory({
                                                    startup_title: task.startup_title,
                                                    developer_name: task.developer_name,
                                                    tasks: projectTasks.length > 0 ? projectTasks : [task]
                                                });
                                                setProjectHistoryModalOpen(true);
                                            }}
                                            className="btn-secondary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}
                                        >
                                            <Briefcase size={14} /> View Review History
                                        </button>

                                        {!viewingDeveloperId && task.status !== 'Completed' && task.status !== 'Submitted' && task.startup_status !== 'Completed' && (
                                            <>
                                                <button onClick={() => openSubmitModal(task)} className="btn-success" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '6px' }}>
                                                    <CheckCircle size={14} /> Submit Progress
                                                </button>
                                                {!task.extension_requested && (
                                                    <button onClick={() => openExtensionModal(task)} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                                        Request Extension
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {
                                    task.feedback && (
                                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: task.status === 'Changes Requested' ? '#fef2f2' : '#f0fdf4', borderLeft: `3px solid ${task.status === 'Changes Requested' ? '#ef4444' : '#10b981'}`, borderRadius: '4px' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: task.status === 'Changes Requested' ? '#b91c1c' : '#047857', marginBottom: '0.25rem' }}>Mentor Feedback:</p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{task.feedback}</p>
                                        </div>
                                    )
                                }
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}

            {/* Submit Progress Modal */}
            {
                submitModalOpen && selectedTask && (
                    <div className="modal">
                        <div className="modal-content" style={{ position: 'relative', maxWidth: '450px', padding: '2rem' }}>
                            <button onClick={() => setSubmitModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>
                            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '600', margin: 0, marginBottom: '0.5rem' }}>Submit Task Progress</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Submit your work for the mentor to review.</p>

                            <form onSubmit={handleSubmitProgress}>
                                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>GitHub Repository Link</label>
                                    <input
                                        type="url"
                                        placeholder="https://github.com/..."
                                        value={submitForm.github_link}
                                        onChange={(e) => setSubmitForm({ ...submitForm, github_link: e.target.value })}
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none' }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Work Completion File (PDF, Image, Zip, etc) *</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setFileInput(e.target.files[0])}
                                        required
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none', background: '#f8fafc' }}
                                    />
                                </div>

                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button type="button" onClick={() => setSubmitModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-success" style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <CheckCircle size={16} /> Submit Work
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Request Extension Modal */}
            {
                extensionModalOpen && selectedTask && (
                    <div className="modal">
                        <div className="modal-content" style={{ position: 'relative', maxWidth: '450px', padding: '2rem' }}>
                            <button onClick={() => setExtensionModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>
                            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '600', margin: 0, marginBottom: '0.5rem' }}>Request Time Extension</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Explain why you need more time for <strong>&quot;{selectedTask.title}&quot;</strong>.</p>

                            <form onSubmit={handleRequestExtension}>
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Reason for Extension *</label>
                                    <textarea
                                        placeholder="I need more time because..."
                                        value={extensionReason}
                                        onChange={(e) => setExtensionReason(e.target.value)}
                                        required
                                        rows={4}
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0.6rem 0.75rem', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>

                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button type="button" onClick={() => setExtensionModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-success" style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                                        Send Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Project History Timeline Modal */}
            {
                projectHistoryModalOpen && selectedProjectHistory && (
                    <div className="modal">
                        <div className="modal-content" style={{ position: 'relative', maxWidth: '750px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                            <button onClick={() => setProjectHistoryModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <Briefcase size={28} color="#2563eb" />
                                <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>Review History</h3>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem', marginLeft: '3.25rem' }}>
                                Project: <strong>{selectedProjectHistory.startup_title}</strong>
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                                {/* Vertical timeline line */}
                                <div style={{ position: 'absolute', left: '1rem', top: '1rem', bottom: '1rem', width: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>

                                {selectedProjectHistory.tasks.map((task, idx) => (
                                    <div key={task.id} style={{ position: 'relative', zIndex: 1, paddingLeft: '3rem' }}>
                                        {/* Timeline dot */}
                                        <div style={{ position: 'absolute', left: '0.4rem', top: '0.5rem', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: task.status === 'Completed' ? '#10b981' : task.status === 'Submitted' ? '#f59e0b' : '#3b82f6', border: '3px solid #ffffff', boxShadow: '0 0 0 1px #cbd5e1' }}></div>

                                        <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: task.status !== 'Completed' && task.status !== 'Submitted' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {task.title}
                                                        <span className={`badge-${task.status.toLowerCase().replace(' ', '-')}-light`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                                            {task.status}
                                                        </span>
                                                    </h4>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                                                        <span>Assigned: {new Date(task.created_at).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>Deadline: <strong style={{ color: '#475569' }}>{new Date(task.deadline).toLocaleDateString()}</strong></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 1rem 0' }}>{task.description}</p>

                                            {(task.github_link || task.work_completion_file) && (
                                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
                                                    {task.github_link && (
                                                        <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                                            <strong style={{ color: '#475569' }}>GitHub:</strong> <a href={task.github_link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{task.github_link}</a>
                                                        </div>
                                                    )}
                                                    {task.work_completion_file && (
                                                        <div style={{ fontSize: '0.85rem' }}>
                                                            <strong style={{ color: '#475569' }}>File:</strong> <a href={task.work_completion_file.startsWith('/uploads') ? `http://localhost:5000${task.work_completion_file}` : task.work_completion_file} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{task.work_completion_file.startsWith('/uploads') ? 'Download Uploaded File' : task.work_completion_file}</a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {task.feedback && (
                                                <div style={{ background: task.status === 'Changes Requested' ? '#fef2f2' : '#f0fdf4', borderLeft: `3px solid ${task.status === 'Changes Requested' ? '#ef4444' : '#10b981'}`, padding: '0.75rem', borderRadius: '4px', marginBottom: '1.25rem' }}>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: task.status === 'Changes Requested' ? '#b91c1c' : '#047857', marginBottom: '0.25rem' }}>Mentor Feedback:</p>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>{task.feedback}</p>
                                                </div>
                                            )}

                                            {/* Actions for Active/Pending Tasks */}
                                            {!viewingDeveloperId && task.status !== 'Completed' && task.status !== 'Submitted' && task.startup_status !== 'Completed' && (
                                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button onClick={() => {
                                                        setProjectHistoryModalOpen(false); // Close history so form modal looks clean
                                                        openSubmitModal(task)
                                                    }} className="btn-success" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '6px' }}>
                                                        <CheckCircle size={14} /> Submit Progress
                                                    </button>

                                                    {!task.extension_requested ? (
                                                        <button onClick={() => {
                                                            setProjectHistoryModalOpen(false);
                                                            openExtensionModal(task)
                                                        }} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                                            Request Extension
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', background: '#fef3c7', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>
                                                            Extension Requested
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default DeveloperDashboard;
