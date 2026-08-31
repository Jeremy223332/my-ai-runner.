const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();

// Enable CORS and JSON body parsing
app.use(cors({ origin: '*' }));
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
        res.json({ status: 'success', output: stdout || 'Executed successfully with zero errors.' });
    });
});

// 2. Real AI Execution Endpoint
app.post('/agent/execute', async (req, res) => {
    const { prompt, apiKey } = req.body;

    if (!prompt) {
        return res.status(400).json({ status: 'error', message: 'No prompt provided.' });
    }

    try {
        const keyToUse = apiKey || process.env.GEMINI_API_KEY;
        if (!keyToUse) {
            return res.status(400).json({ status: 'error', message: 'API key required for AI execution.' });
        }

        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyToUse}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a software developer agent. Write valid JavaScript code for: ${prompt}. Return ONLY executable JavaScript code.`
                    }]
                }]
            })
        });

        const data = await aiResponse.json();
        let rawCode = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        rawCode = rawCode.replace(/```javascript/g, '').replace(/```html/g, '').replace(/```/g, '').trim();

        fs.writeFileSync('./workspace_app.js', rawCode);

        res.json({
            status: 'success',
            code: rawCode,
            message: 'Code written to server.'
        });

    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// 3. Dynamic OAuth Authorization Route
app.get('/auth/:service', (req, res) => {
    const service = req.params.service;

    res.send(`
        <!DOCTYPE html>
        <html>
            <head><title>Authorize ${service}</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #111827; color: white;">
                <h2>Authorize ${service.toUpperCase()} Connection</h2>
                <p>Click below to complete authorization for this application.</p>
                <div style="margin-top: 20px;">
                    <button onclick="sendSuccess()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Authorize</button>
                    <button onclick="sendFailure()" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-left: 10px;">Cancel / Fail</button>
                </div>

                <script>
                    function sendSuccess() {
                        if (window.opener) {
                            window.opener.postMessage({ status: 'connected', service: '${service}' }, '*');
                        }
                        window.close();
                    }

                    function sendFailure() {
                        if (window.opener) {
                            window.opener.postMessage({ status: 'failed', service: '${service}', reason: 'User canceled' }, '*');
                        }
                        window.close();
                    }
                </script>
            </body>
        </html>
    `);
});

// Start Server on Render assigned Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server active on port ${PORT}`));
