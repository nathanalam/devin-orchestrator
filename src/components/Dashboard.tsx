import React, { useState, useEffect } from 'react';
import { RepoList } from './RepoList';
import { ProjectView } from './ProjectView';
import { SettingsModal } from './SettingsModal';
import { api } from '../services/api';
import { Github, Key, Settings, Info } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [selectedRepo, setSelectedRepo] = useState<any>(null);
    const [token, setToken] = useState(api.getGithubToken() || '');
    const [devinToken, setDevinToken] = useState(api.getDevinToken() || '');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (code) {
                try {
                    setIsCheckingAuth(true);
                    const data = await api.github.exchangeToken(code);
                    if (data.access_token) {
                        api.setGithubToken(data.access_token);
                        setToken(data.access_token);
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } catch (e) {
                    console.error("OAuth error", e);
                }
            }

            const storedToken = api.getGithubToken();
            if (storedToken) {
                api.github.getUser()
                    .then(() => setIsAuthenticated(true))
                    .catch(() => setIsAuthenticated(false))
                    .finally(() => setIsCheckingAuth(false));
            } else {
                setIsCheckingAuth(false);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = () => {
        api.setGithubToken(token);
        api.setDevinToken(devinToken);
        window.location.reload();
    };

    if (isCheckingAuth) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100%',
                background: 'var(--color-bg-primary)'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid transparent',
                    borderTopColor: 'var(--color-primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }}></div>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100%',
                padding: '2rem'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '480px',
                    padding: '3rem',
                    background: 'var(--color-surface)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-xl)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-glow)'
                        }}>
                            <img src="/logo.png" alt="Do" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            marginBottom: '0.5rem',
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Devin Orchestrator
                        </h1>
                        <p style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '0.95rem'
                        }}>
                            Connect GitHub and Devin AI to supercharge your workflow
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                GitHub Access
                            </label>
                            <button
                                onClick={() => window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23lieuQ7c564WTAo3f&scope=repo,user`}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    padding: '0.875rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: '#24292e',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Github size={20} />
                                Connect with GitHub
                            </button>
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                marginTop: '0.5rem',
                                textAlign: 'center'
                            }}>
                                Required to access repositories and manage issues
                            </p>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                Devin API Key
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Key
                                    style={{
                                        position: 'absolute',
                                        left: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--color-text-muted)'
                                    }}
                                    size={18}
                                />
                                <input
                                    type="password"
                                    style={{ paddingLeft: '3rem' }}
                                    placeholder="bun_..."
                                    value={devinToken}
                                    onChange={e => setDevinToken(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            className="primary"
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                fontSize: '1rem',
                                fontWeight: '600',
                                marginTop: '0.5rem'
                            }}
                            onClick={handleLogin}
                        >
                            Connect & Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100%'
        }}>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <aside style={{
                width: '360px',
                background: 'var(--color-surface)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'var(--gradient-surface)'
                }}>
                    <h1 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img src="/logo.png" alt="Do" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        Devin Orchestrator
                    </h1>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <RepoList onSelectRepo={setSelectedRepo} />
                </div>
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    background: 'var(--gradient-surface)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <a
                        href="https://devin.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s',
                        }}
                        title="Devin AI"
                    >
                        <Info size={18} />
                    </a>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s',
                        }}
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </aside>
            <main style={{ flex: 1, overflow: 'hidden' }}>
                {selectedRepo ? (
                    <ProjectView repo={selectedRepo} />
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center'
                    }}>
                        <div>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                margin: '0 auto 2rem',
                                background: 'var(--gradient-surface)',
                                borderRadius: 'var(--radius-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--color-border)'
                            }}>
                                <Github size={60} color="var(--color-primary)" />
                            </div>
                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                marginBottom: '0.75rem'
                            }}>
                                Welcome to Devin Orchestrator
                            </h2>
                            <p style={{
                                color: 'var(--color-text-muted)',
                                fontSize: '1.05rem',
                                maxWidth: '400px',
                                margin: '0 auto'
                            }}>
                                Select a repository from the sidebar to start managing issues and collaborating with Devin AI
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
