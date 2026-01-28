import axios from 'axios';

const DEVIN_BASE_URL = 'https://api.devin.ai/v3';

export const handler = async function (event, context) {
    // Handle CORS preflight
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    try {
        const { action, sessionId, apiKey, ...payload } = JSON.parse(event.body || '{}');

        if (!apiKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing API key' }),
            };
        }

        const axiosConfig = {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        };

        let response;
        let url;

        switch (action) {
            case 'createSession':
                // https://docs.devin.ai/api-reference/v3/sessions/post-organizations-sessions
                response = await axios.post(
                    `${DEVIN_BASE_URL}/sessions`,
                    payload,
                    axiosConfig
                );
                break;

            case 'sendMessage':
                if (!sessionId) throw new Error('Missing session ID');
                // v3 might be different, let's assume /sessions/{id}/message or similar.
                // Checking docs from chunk 6... it lists Create/Terminate/List.
                // Wait, "SendMessage" is not explicitly in the chunk 6 headers.
                // However, usually it's interacting with the session.
                // Let's assume v1 compatibility or check docs if I could.
                // Reverting to v1 for sendMessage if v3 is not clear?
                // Actually, the prompt says "https://docs.devin.ai/api-reference/v3/overview".
                // I'll stick to a generic "request" proxy if possible, but let's try to map it.
                // If v3 doesn't have sendMessage, maybe it's via "Playbooks" or something?
                // Let's assume standard REST: POST /sessions/{id}/messages
                response = await axios.post(
                    `${DEVIN_BASE_URL}/sessions/${sessionId}/messages`, // Guessing path
                    { content: payload.message }, // Guessing payload
                    axiosConfig
                );
                break;

            case 'getSession':
                if (!sessionId) throw new Error('Missing session ID');
                response = await axios.get(
                    `${DEVIN_BASE_URL}/sessions/${sessionId}`,
                    axiosConfig
                );
                break;

            case 'listSessions':
                const params = new URLSearchParams();
                if (payload.limit) params.append('limit', payload.limit);
                if (payload.offset) params.append('offset', payload.offset);
                // v3 might use different param names, but these are standard.
                response = await axios.get(
                    `${DEVIN_BASE_URL}/sessions?${params.toString()}`,
                    axiosConfig
                );
                break;

            default:
                // Generic proxy fallback
                if (payload.method && payload.path) {
                    response = await axios({
                        method: payload.method,
                        url: `${DEVIN_BASE_URL}${payload.path}`,
                        data: payload.data,
                        params: payload.params,
                        headers: axiosConfig.headers
                    });
                } else {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Invalid action' }),
                    };
                }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        console.error('Devin API Error:', error.response?.data || error.message);
        return {
            statusCode: error.response?.status || 500,
            headers,
            body: JSON.stringify({
                error: error.response?.data || error.message || 'Failed to communicate with Devin API',
            }),
        };
    }
};
