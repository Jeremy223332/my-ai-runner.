const express = require('express');
const { google } = require('googleapis');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.send('AI Runner Agent Active');
});

// 1. Cloud Code Execution Endpoint
app.post('/run', (req, res) => {
    const { code, script } = req.body;
    const codeToRun = code || script || 'console.log("No code provided");';

    fs.writeFileSync('./workspace_app.js', codeToRun);

    exec('node workspace_app.js', (error, stdout, stderr) => {
        if (error) {
            return res.json({ status: 'error', output: stderr || error.message });
        }
        res.json({ status: 'success', output: stdout || 'Executed successfully.' });
    });
});

// 2. Real AI Execution Endpoint
app.post('/agent/execute', async (req, res) => {
    const { prompt, apiKey } = req.body;
    if (!prompt) return res.status(400).json({ status: 'error', message: 'No prompt provided.' });

    try {
        const keyToUse = apiKey || process.env.GEMINI_API_KEY;
        if (!keyToUse) return res.status(400).json({ status: 'error', message: 'API key required.' });

        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyToUse}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `You are a software developer agent. Write valid JavaScript code for: ${prompt}. Return ONLY executable JavaScript code.` }] }]
            })
        });

        const data = await aiResponse.json();
        let rawCode = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        rawCode = rawCode.replace(/```javascript/g, '').replace(/
