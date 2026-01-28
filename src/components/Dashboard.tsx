import React, { useState, useEffect } from 'react';
import { RepoList } from './RepoList';
import { ProjectView } from './ProjectView';
import { api } from '../services/api';
import { Github, Key } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
    const [token, setToken] = useState(api.getGithubToken() || '');
    const [devinToken, setDevinToken] = useState(api.getDevinToken() || '');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        if (token) {
            // Validate token or just assume valid for now and try to load user
            api.github.getUser()
                .then(() => setIsAuthenticated(true))
                .catch(() => setIsAuthenticated(false))
                .finally(() => setIsCheckingAuth(false));
        } else {
            setIsCheckingAuth(false);
        }
    }, [token]);

    const handleLogin = () => {
        api.setGithubToken(token);
        api.setDevinToken(devinToken);
        // Reload to force check 
        window.location.reload();
    };

    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
                <div className="w-full max-w-md p-8 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg border border-[var(--color-border)]">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">Devin Orchestrator</h1>
                        <p className="text-[var(--color-text-muted)]">Connect to GitHub and Devin to start.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">GitHub Personal Access Token</label>
                            <div className="relative">
                                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                                <input
                                    type="password"
                                    className="pl-10"
                                    placeholder="ghp_..."
                                    value={token}
                                    onChange={e => setToken(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">Required to list repositories and manage issues.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Devin Service Token</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                                <input
                                    type="password"
                                    className="pl-10"
                                    placeholder="cog_..."
                                    value={devinToken}
                                    onChange={e => setDevinToken(e.target.value)}
                                />
                            </div>
                        </div>

                        <button className="w-full bg-[var(--color-primary)] text-white py-2 mt-4" onClick={handleLogin}>
                            Connect
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
            <aside className="w-80 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
                <div className="p-4 border-b border-[var(--color-border)]">
                    <h1 className="font-bold text-lg flex items-center gap-2">
                        <BotIcon /> Devin Orchestrator
                    </h1>
                </div>
                <div className="flex-1 overflow-hidden">
                    <RepoList onSelectRepo={setSelectedRepo} />
                </div>
                <div className="p-4 border-t border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                    Logged in
                </div>
            </aside>
            <main className="flex-1 overflow-hidden">
                {selectedRepo ? (
                    <ProjectView repo={selectedRepo} />
                ) : (
                    <div className="flex items-center justify-center h-full text-[var(--color-text-muted)]">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2 text-[var(--color-text)]">Welcome</h2>
                            <p>Select a repository from the sidebar to get started.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const BotIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 8H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
