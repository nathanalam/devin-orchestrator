import express from 'express';
import cors from 'cors';
import { handler } from './netlify/functions/devin-proxy.js';

const app = express();
const PORT = 8888;

app.use(cors());
app.use(express.json());

// Adapt the Express request to Netlify event/context structure
app.all('/devin-proxy', async (req, res) => {
    console.log(`[Proxy] Incoming ${req.method} request`);
    console.log(`[Proxy] Body:`, JSON.stringify(req.body, null, 2));

    const event = {
        httpMethod: req.method,
        body: JSON.stringify(req.body),
        headers: req.headers
    };

    const context = {};

    try {
        const result = await handler(event, context);
        console.log(`[Proxy] Result Status: ${result.statusCode}`);
        if (result.statusCode >= 400) {
            console.error(`[Proxy] Error:`, result.body);
        }
        res.status(result.statusCode).set(result.headers).send(result.body ? JSON.parse(result.body) : '');
    } catch (e) {
        console.error('[Proxy] Exception:', e);
        res.status(500).send({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Local proxy server running on http://localhost:${PORT}`);
});
