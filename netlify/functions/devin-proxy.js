import axios from 'axios';



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
                response = await axios.post(
                    `https://api.devin.ai/v1/sessions`,
                    payload, // Expected to have prompt, etc.
                    axiosConfig
                );
                break;

            case 'sendMessage':
                if (!sessionId) throw new Error('Missing session ID');
                response = await axios.post(
                    `https://api.devin.ai/v1/sessions/${sessionId}/messages`,
                    { content: payload.message },
                    axiosConfig
                );
                break;

            case 'getSession':
                if (!sessionId) throw new Error('Missing session ID');
                response = await axios.get(
                    `https://api.devin.ai/v1/sessions/${sessionId}`,
                    axiosConfig
                );
                break;

            case 'listSessions':
                const params = new URLSearchParams();
                if (payload.limit) params.append('limit', payload.limit);
                if (payload.offset) params.append('offset', payload.offset);
                response = await axios.get(
                    `https://api.devin.ai/v1/sessions?${params.toString()}`,
                    axiosConfig
                );
                break;

            default:
                // Generic proxy fallback
                if (payload.method && payload.path) {
                    response = await axios({
                        method: payload.method,
                        url: `https://api.devin.ai/v1${payload.path}`,
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
