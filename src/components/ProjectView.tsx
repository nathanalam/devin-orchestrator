import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Send, Bot, AlertCircle, PlusCircle, ExternalLink } from 'lucide-react';

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
    user: {
        login: string;
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

    // Load issues when repo changes
    useEffect(() => {
        if (activeTab === 'issues') {
            loadIssues();
        }
        // Check if we have a saved session for this repo
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
            await api.github.createIssue(repo.full_name.split('/')[0], repo.name, newIssueTitle, newIssueBody);
            setNewIssueTitle('');
            setNewIssueBody('');
            setCreatingIssue(false);
            loadIssues();
        } catch (e) {
            console.error("Failed to create issue", e);
        }
    };

    const startDevinSession = async () => {
        try {
            const res = await api.devin.createSession({
                // Assuming simplified payload for now, or just empty to start a chat
                // User might need to configure repo context in Devin manually or via arguments if supported
                // v3 create session might accept 'tags' or 'playbook_id'
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
            // Assuming response structure, waiting for 'messages' or similar update
            // Usually we might need to poll for updates or use a websocket?
            // For this dashboard, we might just assume basic response or success
            // If the API returns the new state or last message, append it.
            // If not, we might need to poll getSession.

            // Let's optimistic poll for a bit?
            setTimeout(async () => {
                const sessionData = await api.devin.getSession(sessionId);
                // Parse session messages if available
                // sessionData.structured_log or similar?
                console.log("Session update:", sessionData);
            }, 2000);

        } catch (e) {
            console.error("Send failed", e);
            setMessages(prev => [...prev, { role: 'error', content: "Failed to send message." }]);
        }
    };

    // Mock message display since I don't have full session streaming logic implemented
    // Ideally this connects to a stream or periodically calls getSession

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg)]">
            <div className="border-b border-[var(--color-border)] p-6 bg-[var(--color-surface)] shadow-sm z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {repo.name}
                            <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                                <ExternalLink size={18} />
                            </a>
                        </h1>
                        <p className="text-[var(--color-text-muted)]">{repo.description}</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className={`px-4 py-2 ${activeTab === 'issues' ? 'bg-[var(--color-primary)] text-white' : ''}`}
                            onClick={() => setActiveTab('issues')}
                        >
                            <AlertCircle size={18} className="inline mr-2" />
                            Issues
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === 'devin' ? 'bg-[var(--color-primary)] text-white' : ''}`}
                            onClick={() => setActiveTab('devin')}
                        >
                            <Bot size={18} className="inline mr-2" />
                            Devin AI
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-6">
                {activeTab === 'issues' && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Open Issues</h2>
                            <button onClick={() => setCreatingIssue(!creatingIssue)} className="flex items-center gap-2">
                                <PlusCircle size={16} /> New Issue
                            </button>
                        </div>

                        {creatingIssue && (
                            <div className="bg-[var(--color-surface)] p-4 rounded-lg mb-4 border border-[var(--color-border)] animate-in fade-in slide-in-from-top-4">
                                <input
                                    className="mb-2 font-bold"
                                    placeholder="Issue Title"
                                    value={newIssueTitle}
                                    onChange={e => setNewIssueTitle(e.target.value)}
                                />
                                <textarea
                                    className="mb-2 min-h-[100px]"
                                    placeholder="Describe the issue..."
                                    value={newIssueBody}
                                    onChange={e => setNewIssueBody(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setCreatingIssue(false)} className="bg-transparent border border-[var(--color-border)]">Cancel</button>
                                    <button onClick={handleCreateIssue} className="bg-[var(--color-primary)]">Create Issue</button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {loadingIssues ? <p>Loading issues...</p> : issues.map(issue => (
                                <div key={issue.id} className="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg mb-1">
                                            <span className="text-[var(--color-text-muted)] mr-2">#{issue.number}</span>
                                            {issue.title}
                                        </h3>
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${issue.state === 'open' ? 'bg-green-500/20 text-green-500' : 'bg-purple-500/20 text-purple-500'}`}>
                                            {issue.state}
                                        </span>
                                    </div>
                                    <p className="text-[var(--color-text-muted)] mt-1 mb-3 line-clamp-3">{issue.body}</p>
                                    <div className="flex items-center text-sm text-[var(--color-text-muted)]">
                                        <img src={`https://github.com/${issue.user.login}.png`} className="w-5 h-5 rounded-full mr-2" />
                                        {issue.user.login}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'devin' && (
                    <div className="h-full flex flex-col">
                        {!sessionId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <Bot size={64} className="text-[var(--color-primary)] mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Onboard Devin</h2>
                                <p className="text-[var(--color-text-muted)] max-w-md mb-6">
                                    Start a new session to let Devin analyze this repository, potentiall fix bugs, or add features.
                                </p>
                                <button onClick={startDevinSession} className="bg-[var(--color-primary)] text-lg px-8 py-3">
                                    Start Session
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
                                    {messages.length === 0 && <p className="text-center text-[var(--color-text-muted)] my-auto">Start chatting with Devin about this repo.</p>}
                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)]'}`}>
                                                {m.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                        placeholder="Ask Devin to fix an issue or implement a feature..."
                                        className="flex-1"
                                    />
                                    <button onClick={sendMessage} disabled={!input}>
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
