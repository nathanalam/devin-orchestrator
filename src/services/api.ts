import axios from 'axios';

// Local storage keys
const GITHUB_TOKEN_KEY = 'github_token';
const DEVIN_TOKEN_KEY = 'devin_token';

// Helper to get headers
const getGithubHeaders = () => {
    const token = localStorage.getItem(GITHUB_TOKEN_KEY);
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
    };
};

export const api = {
    // Auth Helpers
    setGithubToken: (token: string) => localStorage.setItem(GITHUB_TOKEN_KEY, token),
    getGithubToken: () => localStorage.getItem(GITHUB_TOKEN_KEY),
    setDevinToken: (token: string) => localStorage.setItem(DEVIN_TOKEN_KEY, token),
    getDevinToken: () => localStorage.getItem(DEVIN_TOKEN_KEY),

    // GitHub API
    github: {
        getUser: async () => {
            const res = await axios.get('https://api.github.com/user', { headers: getGithubHeaders() });
            return res.data;
        },
        listRepos: async (page = 1, perPage = 30) => {
            const res = await axios.get(`https://api.github.com/user/repos?sort=updated&page=${page}&per_page=${perPage}`, { headers: getGithubHeaders() });
            return res.data;
        },
        listIssues: async (owner: string, repo: string) => {
            const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`, { headers: getGithubHeaders() });
            return res.data;
        },
        createIssue: async (owner: string, repo: string, title: string, body: string) => {
            const res = await axios.post(`https://api.github.com/repos/${owner}/${repo}/issues`, { title, body }, { headers: getGithubHeaders() });
            return res.data;
        }
    },

    // Devin API (via Proxy)
    devin: {
        request: async (action: string, payload: any = {}) => {
            const apiKey = localStorage.getItem(DEVIN_TOKEN_KEY) || ''; // Fallback to provided defaults if user wants
            const res = await axios.post('/.netlify/functions/devin-proxy', {
                action,
                apiKey,
                ...payload
            });
            return res.data;
        },
        listSessions: async (limit = 20) => {
            return api.devin.request('listSessions', { limit });
        },
        createSession: async (payload: any) => {
            // Payload typically needs `snapshot_id` or similar? 
            // Or `playbook_id`?
            // Generic create session for now.
            return api.devin.request('createSession', payload);
        },
        sendMessage: async (sessionId: string, message: string) => {
            return api.devin.request('sendMessage', { sessionId, message }); // Proxy maps this to whatever endpoint
        },
        getSession: async (sessionId: string) => {
            return api.devin.request('getSession', { sessionId });
        }
    }
};
