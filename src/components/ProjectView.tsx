import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Send, Bot, AlertCircle, PlusCircle, ExternalLink, MessageSquare, Play, ArrowLeft } from 'lucide-react';

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

interface Session {
    session_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    url?: string;
    title?: string;
    tags?: string[];
    pull_request?: { url: string };
    structured_output?: { pull_request_url?: string };
}

interface Message {
    role: string;
    content: string;
    timestamp?: number;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ repo }) => {
    const [activeTab, setActiveTab] = useState<'issues' | 'sessions'>('issues');

    // Issues State
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loadingIssues, setLoadingIssues] = useState(false);
    const [creatingIssue, setCreatingIssue] = useState(false);
    const [newIssueTitle, setNewIssueTitle] = useState('');
    const [newIssueBody, setNewIssueBody] = useState('');

    // Sessions List State
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // Chat/Session View State
    const [activeView, setActiveView] = useState<'list' | 'chat'>('list');
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);

    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');

    // Confidence State
    const [confidence, setConfidence] = useState<{ score: number, reasoning: string } | null>(null);
    const [sessionStatus, setSessionStatus] = useState<'init' | 'gathering' | 'running'>('init');

    const chatEndRef = useRef<HTMLDivElement>(null);

    // -- Load Issues --
    useEffect(() => {
        if (activeTab === 'issues') {
            loadIssues();
        } else if (activeTab === 'sessions') {
            loadSessions();
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

    const loadSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await api.devin.listSessions(20);
            // Optional: Filter by repo if API doesn't support it, currently generic list
            // Assuming response has { sessions: [] } or just []
            const sessionList = res.sessions || res || [];
            if (Array.isArray(sessionList)) {
                // Filter by repo tag as per instruction: "repo:owner/repo"
                const strictFiltered = sessionList.filter((s: Session) =>
                    s.tags && s.tags.includes(`repo:${repo.full_name}`)
                );
                setSessions(strictFiltered);
            }
        } catch (e) {
            console.error("Failed to list sessions", e);
        } finally {
            setLoadingSessions(false);
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

    // -- Chat Logic --

    const openIssueChat = async (issue: Issue) => {
        setCurrentIssue(issue);
        setActiveView('chat');
        setChatMessages([]);
        setConfidence(null);
        setSessionStatus('init');

        // Check for existing session for this issue
        const savedSessionId = localStorage.getItem(`devin_session_issue_${repo.full_name}_${issue.number}`);

        if (savedSessionId) {
            setCurrentSessionId(savedSessionId);
            setSessionStatus('gathering'); // Assume already gathered
            loadChatHistory(savedSessionId);
        } else {
            // Create new session flow
            initializeIssueSession(issue);
        }
    };

    const openSession = (session: Session) => {
        setCurrentSessionId(session.session_id);
        setCurrentSession(session);
        setCurrentIssue(null); // Generic session
        setActiveView('chat');
        setSessionStatus(session.status === 'running' ? 'running' : 'init');
        loadChatHistory(session.session_id);
    };

    const initializeIssueSession = async (issue: Issue) => {
        // Initial loading feedback
        setChatMessages([{ role: 'system', content: 'Starting session with Devin...' }]);

        try {
            // Create Session
            const res = await api.devin.createSession({
                prompt: `I am investigating issue #${issue.number}: ${issue.title}\n\n${issue.body}\n\nRepository: ${repo.full_name}`,
                tags: [`repo:${repo.full_name}`, `issue:${issue.number}`]
            });

            if (res && res.session_id) {
                const sid = res.session_id;
                setCurrentSessionId(sid);
                localStorage.setItem(`devin_session_issue_${repo.full_name}_${issue.number}`, sid);

                // Update UI to show session created
                setChatMessages(prev => [...prev, { role: 'system', content: `Session ${sid.substring(0, 8)} created. Assessing confidence...` }]);

                // Wait a moment for session to completely initialize/propagate
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Prompt for Confidence
                const confidencePrompt = `Assess your confidence in addressing this issue. 
                Respond ONLY with a JSON object in this format: 
                { "score": number, "reasoning": "string" }
                Score should be 0-100.`;

                // Wait a bit or send message immediately
                await api.devin.sendMessage(sid, confidencePrompt);

                // Poll for response (simulated via standard chat load or explicit check)
                // For now, let's manually fetch messages after a delay or just wait users input
                // But request says "start by asking... before actually beginning to chat".
                // So we should try to get the response.
                pollForConfidence(sid);
            } else {
                throw new Error("No session ID returned");
            }
        } catch (e: any) {
            console.error("Failed to init session", e);
            const errorMsg = e.response?.data?.error || e.message || 'Unknown error';
            setChatMessages(prev => [...prev, { role: 'error', content: `Failed to initialize session on Devin: ${errorMsg}` }]);
        }
    };

    const pollForConfidence = async (sid: string) => {
        let parsed = false;
        const interval = setInterval(async () => {
            if (parsed || !sid) {
                clearInterval(interval);
                return;
            }
            try {
                const data = await api.devin.getSession(sid);
                const msgs = data.messages || [];
                if (msgs.length > 0) {
                    const lastMsg = msgs[msgs.length - 1];
                    // Look for JSON in the assistant's response
                    const isAssistant = lastMsg.type === 'devin_message' || lastMsg.role === 'assistant' || lastMsg.role === 'model';
                    if (lastMsg && isAssistant) {
                        const content = lastMsg.message || lastMsg.body || lastMsg.content || "";
                        const jsonMatch = content.match(/\{[\s\S]*"score"[\s\S]*\}/);
                        if (jsonMatch) {
                            try {
                                const json = JSON.parse(jsonMatch[0]);
                                if (json.score !== undefined) {
                                    setConfidence(json);
                                    setSessionStatus('gathering');
                                    parsed = true;

                                    const mappedMessages = msgs.map((m: any) => ({
                                        role: (m.type === 'devin_message' || m.role === 'model' || m.role === 'assistant') ? 'assistant' : 'user',
                                        content: m.message || m.body || m.content || ''
                                    }));
                                    setChatMessages(mappedMessages);
                                }
                            } catch (e) {
                                console.log("Failed to parse confidence JSON", e);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 3000);
    };

    const loadChatHistory = async (sid: string) => {
        try {
            const data = await api.devin.getSession(sid);

            // Update session details if available
            if (data && data.session_id === sid) {
                //@ts-ignore
                setCurrentSession(prev => ({ ...(prev || {}), ...data }));
            }

            if (data.messages && Array.isArray(data.messages)) {
                const mappedMessages = data.messages.map((m: any) => ({
                    role: (m.type === 'devin_message' || m.role === 'model' || m.role === 'assistant') ? 'assistant' : 'user',
                    content: m.message || m.body || m.content || ''
                }));
                setChatMessages(mappedMessages);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !currentSessionId) return;
        const text = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: text }]);

        try {
            await api.devin.sendMessage(currentSessionId, text);
            console.log("Message sent successfully");

            // Poll for response shortly after
            setTimeout(() => {
                loadChatHistory(currentSessionId);
            }, 2000);
        } catch (e: any) {
            console.error("Failed to send message:", e);
            setChatMessages(prev => [...prev, { role: 'error', content: `Failed to send: ${e.message || 'Unknown error'}` }]);
        }
    };

    const startExecution = async () => {
        if (!currentSessionId) return;
        setSessionStatus('running');
        setChatMessages(prev => [...prev, { role: 'system', content: 'Session started. Devin is now working on the issue.' }]);
        try {
            await api.devin.sendMessage(currentSessionId, "Please proceed with the fix. Start session.");
        } catch (e) { }
    };

    // -- Render Helpers --

    const renderConfidence = () => {
        if (confidence) {
            return (
                <div className="glass-card animate-slide-up" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 600 }}>Confidence Assessment</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-bg-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem',
                            border: `3px solid ${confidence.score > 70 ? 'var(--color-success)' : 'var(--color-warning)'}`,
                            color: confidence.score > 70 ? 'var(--color-success)' : 'var(--color-warning)'
                        }}>
                            {confidence.score}%
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            {confidence.reasoning}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // -- Views --

    if (activeView === 'chat') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-primary)' }}>
                {/* Chat Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'var(--gradient-surface)',
                    display: 'flex', alignItems: 'center', gap: '1rem'
                }}>
                    <button
                        onClick={() => setActiveView('list')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                            {currentSession?.title || (currentIssue ? `Issue #${currentIssue.number}: ${currentIssue.title}` : 'Devin Session')}
                        </h2>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: sessionStatus === 'running' || currentSession?.status === 'running' ? 'var(--color-success)' : 'var(--color-warning)'
                            }} />
                            {currentSession?.status || (sessionStatus === 'running' ? 'In Progress' : 'Requirement Gathering')}
                        </div>
                        {(currentSession?.pull_request?.url || currentSession?.structured_output?.pull_request_url) && (
                            <div style={{ marginTop: '0.25rem' }}>
                                <a
                                    href={currentSession?.pull_request?.url || currentSession?.structured_output?.pull_request_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    <ExternalLink size={12} /> View Pull Request
                                </a>
                            </div>
                        )}
                    </div>
                    {sessionStatus === 'gathering' && (
                        <button
                            className="primary"
                            onClick={startExecution}
                            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                        >
                            <Play size={16} fill="currentColor" />
                            Start Session
                        </button>
                    )}
                </div>

                {/* Chat Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {renderConfidence()}

                    {chatMessages.map((m, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                maxWidth: '80%',
                                padding: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                background: m.role === 'user' ? 'var(--gradient-primary)' : 'var(--color-surface)',
                                color: m.role === 'user' ? 'white' : 'var(--color-text-primary)',
                                boxShadow: 'var(--shadow-sm)',
                                border: m.role !== 'user' ? '1px solid var(--color-border)' : 'none'
                            }}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                            placeholder="Type a message to Devin..."
                            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        />
                        <button className="primary" onClick={handleSendMessage} style={{ padding: '0 1rem' }}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-primary)' }}>
            {/* Header */}
            <div style={{
                padding: '2rem',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--gradient-surface)',
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>{repo.name}</h1>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setActiveTab('issues')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
                            background: activeTab === 'issues' ? 'var(--gradient-primary)' : 'var(--color-surface)',
                            color: activeTab === 'issues' ? 'white' : 'var(--color-text-primary)',
                            border: activeTab === 'issues' ? 'none' : '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)', fontWeight: '500', cursor: 'pointer'
                        }}
                    >
                        <AlertCircle size={18} />
                        Issues
                    </button>
                    <button
                        onClick={() => setActiveTab('sessions')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
                            background: activeTab === 'sessions' ? 'var(--gradient-primary)' : 'var(--color-surface)',
                            color: activeTab === 'sessions' ? 'white' : 'var(--color-text-primary)',
                            border: activeTab === 'sessions' ? 'none' : '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)', fontWeight: '500', cursor: 'pointer'
                        }}
                    >
                        <Bot size={18} />
                        Sessions
                    </button>
                </div>
            </div>

            {/* List Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                {activeTab === 'issues' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Open Issues</h2>
                            <button
                                onClick={() => setCreatingIssue(!creatingIssue)}
                                className="primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <PlusCircle size={16} /> New Issue
                            </button>
                        </div>

                        {creatingIssue && (
                            <div className="glass-card animate-slide-up" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <input
                                    style={{ marginBottom: '1rem', fontWeight: '600', fontSize: '1.0625rem', width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                    placeholder="Issue Title"
                                    value={newIssueTitle}
                                    onChange={e => setNewIssueTitle(e.target.value)}
                                />
                                <textarea
                                    style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', minHeight: '100px' }}
                                    placeholder="Describe the issue..."
                                    value={newIssueBody}
                                    onChange={e => setNewIssueBody(e.target.value)}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button onClick={() => setCreatingIssue(false)}>Cancel</button>
                                    <button onClick={handleCreateIssue} className="primary">Create Issue</button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {loadingIssues ? (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Loading Issues...</div>
                            ) : issues.map(issue => (
                                <div key={issue.id} className="glass-card" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                            <span style={{ color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>#{issue.number}</span>
                                            {issue.title}
                                        </h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                                            background: issue.state === 'open' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                            color: issue.state === 'open' ? '#10B981' : '#8B5CF6'
                                        }}>
                                            {issue.state}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {issue.body}
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <a
                                            href={issue.html_url} target="_blank" rel="noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none'
                                            }}
                                        >
                                            <ExternalLink size={16} /> Link
                                        </a>
                                        <button
                                            onClick={() => openIssueChat(issue)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                                                background: 'var(--color-surface)', color: 'var(--color-primary)',
                                                border: '1px solid var(--color-primary)', cursor: 'pointer'
                                            }}
                                        >
                                            <MessageSquare size={16} /> Chat & Fix
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loadingSessions ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Loading Sessions...</div>
                        ) : sessions.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>No sessions found.</div>
                        ) : sessions.map(session => (
                            <div key={session.session_id} onClick={() => openSession(session)} className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{session.title || `Session ${session.session_id.substring(0, 8)}`}</h3>
                                        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                            Last active: {new Date(session.updated_at || Date.now()).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                                        {session.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
