import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { GitBranch, Star, Search, Clock } from 'lucide-react';

interface Repo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    stargazers_count: number;
    html_url: string;
    updated_at: string;
    language: string;
}

interface RepoListProps {
    onSelectRepo: (repo: Repo) => void;
}

export const RepoList: React.FC<RepoListProps> = ({ onSelectRepo }) => {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadRepos();
    }, []);

    const loadRepos = async () => {
        setLoading(true);
        try {
            const data = await api.github.listRepos(1, 100);
            setRepos(data);
        } catch (error) {
            console.error("Failed to load repos", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRepos = repos.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '1rem'
                }}>
                    Repositories
                </h2>
                <div style={{ position: 'relative' }}>
                    <Search
                        style={{
                            position: 'absolute',
                            left: '0.875rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--color-text-muted)',
                            pointerEvents: 'none'
                        }}
                        size={16}
                    />
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        style={{ paddingLeft: '2.5rem' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.75rem'
            }}>
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            margin: '0 auto 1rem',
                            border: '2px solid transparent',
                            borderTopColor: 'var(--color-primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }}></div>
                        Loading repositories...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {filteredRepos.map(repo => (
                            <div
                                key={repo.id}
                                onClick={() => onSelectRepo(repo)}
                                className="glass-card"
                                style={{
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '0.5rem'
                                }}>
                                    <h3 style={{
                                        fontSize: '0.9375rem',
                                        fontWeight: '600',
                                        color: 'var(--color-primary)',
                                        margin: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                    }}>
                                        {repo.name}
                                    </h3>
                                    {repo.stargazers_count > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--color-text-muted)',
                                            marginLeft: '0.5rem',
                                            flexShrink: 0
                                        }}>
                                            <Star size={12} fill="var(--color-warning)" color="var(--color-warning)" />
                                            {repo.stargazers_count}
                                        </div>
                                    )}
                                </div>

                                {repo.description && (
                                    <p style={{
                                        fontSize: '0.8125rem',
                                        color: 'var(--color-text-muted)',
                                        margin: '0 0 0.75rem 0',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        lineHeight: '1.4'
                                    }}>
                                        {repo.description}
                                    </p>
                                )}

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    {repo.language && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: 'var(--color-primary)'
                                            }}></div>
                                            {repo.language}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <Clock size={12} />
                                        {formatDate(repo.updated_at)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredRepos.length === 0 && !loading && (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem 1rem',
                                color: 'var(--color-text-muted)'
                            }}>
                                <GitBranch size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                <p>No repositories found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
