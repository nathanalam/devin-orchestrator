import express from 'express';
import cors from 'cors';
import { handler as devinHandler } from './netlify/functions/devin-proxy.js';
import { handler as exchangeHandler } from './netlify/functions/exchange-token.js';

const app = express();
const PORT = 8888;

app.use(cors());
app.use(express.json());

const wrapHandler = (handler) => async (req, res) => {
    console.log(`[Proxy] Incoming ${req.method} request to ${req.path}`);

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

        const bodyContent = result.body ? JSON.parse(result.body) : {};
        res.status(result.statusCode).set(result.headers || {}).send(bodyContent);
    } catch (e) {
        console.error('[Proxy] Exception:', e);
        res.status(500).send({ error: e.message });
    }
};

// Define routes matching the function names (without .netlify/functions prefix as Vite strips it)
app.all('/devin-proxy', wrapHandler(devinHandler));
app.all('/exchange-token', wrapHandler(exchangeHandler));

app.listen(PORT, () => {
    console.log(`Local proxy server running on http://localhost:${PORT}`);
});
