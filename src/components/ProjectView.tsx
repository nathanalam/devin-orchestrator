import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Send, Bot, AlertCircle, PlusCircle, ExternalLink, MessageSquare, Calendar } from 'lucide-react';

interface Repo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
}

interface Issue {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    html_url: string;
    created_at: string;
    user: {
        login: string;
        avatar_url: string;
    };
}

interface ProjectViewProps {
    repo: Repo;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ repo }) => {
    const [activeTab, setActiveTab] = useState<'issues' | 'devin'>('issues');
    const [issues, setIssues] = useState<Issue[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loadingIssues, setLoadingIssues] = useState(false);
    const [creatingIssue, setCreatingIssue] = useState(false);
    const [newIssueTitle, setNewIssueTitle] = useState('');
    const [newIssueBody, setNewIssueBody] = useState('');

    useEffect(() => {
        if (activeTab === 'issues') {
            loadIssues();
        }
        const savedSession = localStorage.getItem(`devin_session_${repo.full_name}`);
        if (savedSession) {
            setSessionId(savedSession);
        }
    }, [repo, activeTab]);

    const loadIssues = async () => {
        setLoadingIssues(true);
        try {
            const data = await api.github.listIssues(repo.full_name.split('/')[0], repo.name);
            setIssues(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingIssues(false);
        }
    };

    const handleCreateIssue = async () => {
        if (!newIssueTitle) return;
        try {
            const newIssue = await api.github.createIssue(repo.full_name.split('/')[0], repo.name, newIssueTitle, newIssueBody);
            setIssues(prev => [newIssue, ...prev]);
            setNewIssueTitle('');
            setNewIssueBody('');
            setCreatingIssue(false);
        } catch (e) {
            console.error("Failed to create issue", e);
        }
    };

    const startDevinSession = async () => {
        try {
            const res = await api.devin.createSession({
                tags: [`repo:${repo.full_name}`]
            });
            if (res && res.session_id) {
                setSessionId(res.session_id);
                localStorage.setItem(`devin_session_${repo.full_name}`, res.session_id);
                setMessages(prev => [...prev, { role: 'system', content: `Session ${res.session_id} started.` }]);
            }
        } catch (e) {
            console.error("Failed to start session", e);
            alert("Failed to create Devin session");
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !sessionId) return;
        const msg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);

        try {
            const res = await api.devin.sendMessage(sessionId, msg);
            console.log("Message sent:", res);

            setTimeout(async () => {
                const sessionData = await api.devin.getSession(sessionId);
                console.log("Session update:", sessionData);
            }, 2000);

        } catch (e) {
            console.error("Send failed", e);
            setMessages(prev => [...prev, { role: 'error', content: "Failed to send message." }]);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--color-bg-primary)'
        }}>
            {/* Header */}
            <div style={{
                padding: '2rem',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--gradient-surface)',
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.5rem'
                        }}>
                            <h1 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                margin: 0
                            }}>
                                {repo.name}
                            </h1>
                            <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: 'var(--color-text-muted)',
                                    transition: 'color 0.2s'
                                }}
                            >
                                <ExternalLink size={20} />
                            </a>
                        </div>
                        {repo.description && (
                            <p style={{
                                color: 'var(--color-text-muted)',
                                margin: 0,
                                fontSize: '0.9375rem'
                            }}>
                                {repo.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                }}>
                    <button
                        onClick={() => setActiveTab('issues')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1.25rem',
                            background: activeTab === 'issues' ? 'var(--gradient-primary)' : 'var(--color-surface)',
                            color: activeTab === 'issues' ? 'white' : 'var(--color-text-primary)',
                            border: activeTab === 'issues' ? 'none' : '1px solid var(--color-border)',
                            fontWeight: '500'
                        }}
                    >
                        <AlertCircle size={18} />
                        Issues
                    </button>
                    <button
                        onClick={() => setActiveTab('devin')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1.25rem',
                            background: activeTab === 'devin' ? 'var(--gradient-primary)' : 'var(--color-surface)',
                            color: activeTab === 'devin' ? 'white' : 'var(--color-text-primary)',
                            border: activeTab === 'devin' ? 'none' : '1px solid var(--color-border)',
                            fontWeight: '500'
                        }}
                    >
                        <Bot size={18} />
                        Devin AI
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '2rem' }}>
                {activeTab === 'issues' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                margin: 0
                            }}>
                                Open Issues
                            </h2>
                            <button
                                onClick={() => setCreatingIssue(!creatingIssue)}
                                className="primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <PlusCircle size={16} />
                                New Issue
                            </button>
                        </div>

                        {creatingIssue && (
                            <div
                                className="glass-card animate-slide-up"
                                style={{
                                    padding: '1.5rem',
                                    marginBottom: '1.5rem'
                                }}
                            >
                                <input
                                    style={{
                                        marginBottom: '1rem',
                                        fontWeight: '600',
                                        fontSize: '1.0625rem'
                                    }}
                                    placeholder="Issue Title"
                                    value={newIssueTitle}
                                    onChange={e => setNewIssueTitle(e.target.value)}
                                />
                                <textarea
                                    style={{ marginBottom: '1rem' }}
                                    placeholder="Describe the issue..."
                                    value={newIssueBody}
                                    onChange={e => setNewIssueBody(e.target.value)}
                                />
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '0.75rem'
                                }}>
                                    <button onClick={() => setCreatingIssue(false)}>
                                        Cancel
                                    </button>
                                    <button onClick={handleCreateIssue} className="primary">
                                        Create Issue
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            {loadingIssues ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    Loading issues...
                                </div>
                            ) : issues.map(issue => (
                                <div key={issue.id} className="glass-card" style={{ padding: '1.5rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <h3 style={{
                                            fontSize: '1.0625rem',
                                            fontWeight: '600',
                                            margin: 0,
                                            flex: 1
                                        }}>
                                            <span style={{
                                                color: 'var(--color-text-muted)',
                                                marginRight: '0.5rem'
                                            }}>
                                                #{issue.number}
                                            </span>
                                            {issue.title}
                                        </h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            background: issue.state === 'open'
                                                ? 'rgba(16, 185, 129, 0.15)'
                                                : 'rgba(139, 92, 246, 0.15)',
                                            color: issue.state === 'open'
                                                ? 'var(--color-success)'
                                                : 'var(--color-secondary)',
                                            marginLeft: '1rem'
                                        }}>
                                            {issue.state}
                                        </span>
                                    </div>

                                    {issue.body && (
                                        <p style={{
                                            color: 'var(--color-text-muted)',
                                            margin: '0 0 1rem 0',
                                            fontSize: '0.9375rem',
                                            lineHeight: '1.6',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {issue.body}
                                        </p>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        fontSize: '0.8125rem',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <img
                                                src={issue.user.avatar_url || `https://github.com/${issue.user.login}.png`}
                                                alt={issue.user.login}
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    border: '1px solid var(--color-border)'
                                                }}
                                            />
                                            {issue.user.login}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <Calendar size={14} />
                                            {formatDate(issue.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {issues.length === 0 && !loadingIssues && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '4rem 2rem',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    <AlertCircle size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                    <p style={{ fontSize: '1.0625rem' }}>No open issues</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'devin' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {!sessionId ? (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: '3rem'
                            }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    margin: '0 auto 2rem',
                                    background: 'var(--gradient-primary)',
                                    borderRadius: 'var(--radius-xl)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-glow)'
                                }}>
                                    <Bot size={60} color="white" />
                                </div>
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    fontWeight: '700',
                                    marginBottom: '0.75rem'
                                }}>
                                    Onboard Devin AI
                                </h2>
                                <p style={{
                                    color: 'var(--color-text-muted)',
                                    maxWidth: '480px',
                                    marginBottom: '2rem',
                                    fontSize: '1.0625rem',
                                    lineHeight: '1.6'
                                }}>
                                    Start a new session to let Devin analyze this repository, fix bugs, or implement new features
                                </p>
                                <button
                                    onClick={startDevinSession}
                                    className="primary"
                                    style={{
                                        fontSize: '1.0625rem',
                                        padding: '0.875rem 2rem'
                                    }}
                                >
                                    Start Session
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    marginBottom: '1.5rem',
                                    padding: '1.5rem',
                                    background: 'var(--color-surface)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    {messages.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '3rem',
                                            color: 'var(--color-text-muted)'
                                        }}>
                                            <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                            <p>Start chatting with Devin about this repository</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {messages.map((m, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                                                    }}
                                                >
                                                    <div style={{
                                                        maxWidth: '75%',
                                                        padding: '0.875rem 1.125rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        background: m.role === 'user'
                                                            ? 'var(--gradient-primary)'
                                                            : 'var(--color-surface-elevated)',
                                                        color: m.role === 'user' ? 'white' : 'var(--color-text-primary)',
                                                        fontSize: '0.9375rem',
                                                        lineHeight: '1.5',
                                                        boxShadow: 'var(--shadow-sm)'
                                                    }}>
                                                        {m.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                        placeholder="Ask Devin to fix an issue or implement a feature..."
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!input.trim()}
                                        className="primary"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0.75rem 1.5rem'
                                        }}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
