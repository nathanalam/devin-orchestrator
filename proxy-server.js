import express from 'express';
import cors from 'cors';
import { handler } from './netlify/functions/devin-proxy.js';

const app = express();
const PORT = 8888;

app.use(cors());
app.use(express.json());

// Mock the Netlify event/context structure
app.all('/devin-proxy', async (req, res) => {
    const event = {
        httpMethod: req.method,
        body: JSON.stringify(req.body),
        headers: req.headers
    };

    const context = {};

    try {
        const result = await handler(event, context);
        res.status(result.statusCode).set(result.headers).send(result.body ? JSON.parse(result.body) : '');
    } catch (e) {
        console.error(e);
        res.status(500).send({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Local proxy server running on http://localhost:${PORT}`);
});
