const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

let connectedServices = { discord: false, google: false };

app.get('/', (req, res) => res.send('AI Runner Agent Active'));

// 1. Real AI Command Execution Endpoint
app.post('/agent/execute', async (req, res) => {
    const { prompt, apiKey } = req.body;

    if (!prompt) {
        return res.status(400).json({ status: 'error', message: 'No prompt provided.' });
    }

    // Call Google Gemini API to write real code based on prompt
    try {
        const keyToUse = apiKey || process.env.GEMINI_API_KEY;
        if (!keyToUse) {
            return res.status(400).json({ status: 'error', message: 'API key required for real AI execution.' });
        }

        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyToUse}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a real software developer agent. Write valid production JavaScript code for: ${prompt}. Return ONLY code inside standard syntax without conversational prose.`
                    }]
                }]
            })
        });

        const data = await aiResponse.json();
        let rawCode = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Clean markdown code blocks if present
        rawCode = rawCode.replace(/```javascript/g, '').replace(/
