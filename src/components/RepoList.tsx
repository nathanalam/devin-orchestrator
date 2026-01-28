import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { GitBranch, Star, Search } from 'lucide-react';

interface Repo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    stargazers_count: number;
    html_url: string;
    updated_at: string;
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

    const filteredRepos = repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
                <h2 className="text-xl font-bold mb-4">Repositories</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="text-center p-4 text-[var(--color-text-muted)]">Loading repositories...</div>
                ) : (
                    <div className="space-y-2">
                        {filteredRepos.map(repo => (
                            <div
                                key={repo.id}
                                onClick={() => onSelectRepo(repo)}
                                className="p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors border border-transparent hover:border-[var(--color-border)]"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-medium text-[var(--color-primary)] truncate" title={repo.name}>{repo.name}</h3>
                                    <div className="flex items-center text-xs text-[var(--color-text-muted)]">
                                        <Star size={12} className="mr-1" />
                                        {repo.stargazers_count}
                                    </div>
                                </div>
                                <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 my-1">{repo.description || "No description"}</p>
                                <div className="flex items-center text-xs text-[var(--color-text-muted)] mt-2">
                                    <GitBranch size={12} className="mr-1" />
                                    Updated {new Date(repo.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                        {filteredRepos.length === 0 && !loading && (
                            <div className="text-center p-4 text-[var(--color-text-muted)]">No repositories found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
