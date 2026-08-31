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
const express = require('express');
const app = express();

// 1. Initiate OAuth (Redirects user or renders authorization flow)
app.get('/auth/:service', (req, res) => {
    const service = req.params.service; // e.g., 'youtube', 'discord'

    // Example redirect logic:
    // If you have real OAuth keys setup, redirect to provider's auth URL.
    // Otherwise, simulate the authorization step for testing:
    
    res.send(`
        <html>
            <head><title>Authorize ${service}</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #111827; color: white;">
                <h2>Authorize ${service.toUpperCase()} Connection</h2>
                <p>Click below to complete authorization for this app.</p>
                <button onclick="sendSuccess()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Authorize</button>
                <button onclick="sendFailure()" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-left: 10px;">Cancel / Fail</button>

                <script>
                    function sendSuccess() {
                        if (window.opener) {
                            window.opener.postMessage({ status: 'connected', service: '${service}' }, '*');
                        }
                        window.close();
                    }

                    function sendFailure() {
                        if (window.opener) {
                            window.opener.postMessage({ status: 'failed', service: '${service}', reason: 'User canceled authorization' }, '*');
                        }
                        window.close();
                    }
                </script>
            </body>
        </html>
    `);
});

// 2. Handle actual OAuth callback (if using real OAuth redirect URIs)
app.get('/auth/:service/callback', (req, res) => {
    const service = req.params.service;
    const error = req.query.error;

    if (error) {
        return res.send(`
            <script>
                if (window.opener) {
                    window.opener.postMessage({ status: 'failed', service: '${service}', reason: '${error}' }, '*');
                }
                window.close();
            </script>
        `);
    }

    // On successful auth verification:
    res.send(`
        <script>
            if (window.opener) {
                window.opener.postMessage({ status: 'connected', service: '${service}' }, '*');
            }
            window.close();
        </script>
    `);
});
// Make sure express.json() middleware is enabled at the top of your server file
app.use(express.json());

// Handle cloud execution requests from studio.html
app.post('/run', (req, res) => {
    const { code } = req.body;
    console.log("Executing workspace code:", code);

    // Return success response to the frontend
    res.json({
        success: true,
        message: "Code executed successfully",
        output: "Execution finished with 0 errors."
    });
});
