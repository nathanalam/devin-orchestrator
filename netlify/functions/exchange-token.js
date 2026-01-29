const axios = require('axios');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const { code } = JSON.parse(event.body);
        const client_id = 'Ov23lieuQ7c564WTAo3f';
        const client_secret = process.env.GITHUB_CLIENT_SECRET;

        if (!code) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing code' }),
            };
        }

        if (!client_secret) {
            console.error('Missing GITHUB_CLIENT_SECRET');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' }),
            };
        }

        const response = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id,
                client_secret,
                code,
            },
            {
                headers: {
                    Accept: 'application/json',
                },
            }
        );

        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        console.error('Error exchanging token:', error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to exchange token' }),
        };
    }
};
