const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
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
        res.json({ status: 'success', output: stdout || 'Executed successfully with zero errors.' });
    });
});

// 2. Dynamic OAuth Authorization Route with Profile Display
app.get('/auth/:service', (req, res) => {
    const service = req.params.service;
    
    const mockUser = {
        displayName: "Jeremiah",
        username: "@JeremiahUser",
        avatarUrl: "[https://api.dicebear.com/7.x/bottts/svg?seed=Jeremiah](https://api.dicebear.com/7.x/bottts/svg?seed=Jeremiah)"
    };

    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Authorize ${service}</title>
                <style>
                    body {
                        font-family: system-ui, -apple-system, sans-serif;
                        text-align: center;
                        padding: 40px 20px;
                        background: #111827;
                        color: white;
                        margin: 0;
                    }
                    .card {
                        background: #1f2937;
                        padding: 24px;
                        border-radius: 12px;
                        max-width: 380px;
                        margin: 0 auto;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                        border: 1px solid #374151;
                    }
                    .avatar {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        border: 3px solid #8b5cf6;
                        margin-bottom: 12px;
                        background-color: #0d1117;
                    }
                    .display-name {
                        font-size: 1.25rem;
                        font-weight: bold;
                        margin: 4px 0;
                    }
                    .username {
                        color: #9ca3af;
                        font-size: 0.9rem;
                        margin-bottom: 16px;
                    }
                    .info-box {
                        background: #111827;
                        padding: 10px 14px;
                        border-radius: 8px;
                        font-size: 0.85rem;
                        color: #d1d5db;
                        margin-bottom: 20px;
                    }
                    .btn-group {
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                    }
                    button {
                        padding: 10px 18px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 0.9rem;
                        flex: 1;
                    }
                    .btn-authorize { background: #10b981; color: white; }
                    .btn-cancel { background: #ef4444; color: white; }
                </style>
            </head>
            <body>
                <div class="card">
                    <img class="avatar" src="${mockUser.avatarUrl}" alt="User Avatar" />
                    <div class="display-name">${mockUser.displayName}</div>
                    <div class="username">${mockUser.username}</div>

                    <div class="info-box">
                        Connecting to <strong>${service.toUpperCase()}</strong>.<br>
                        Verify this is your account before proceeding.
                    </div>

                    <div class="btn-group">
                        <button class="btn-authorize" onclick="sendSuccess()">Authorize</button>
                        <button class="btn-cancel" onclick="sendFailure()">Cancel</button>
                    </div>
                </div>

                <script>
                    function sendSuccess() {
                        if (window.opener) {
                            window.opener.postMessage({ 
                                status: 'connected', 
                                service: '${service}',
                                user: {
                                    displayName: '${mockUser.displayName}',
                                    username: '${mockUser.username}'
                                }
                            }, '*');
                        }
                        window.close();
                    }

                    function sendFailure() {
                        if (window.opener) {
                            window.opener.postMessage({ 
                                status: 'failed', 
                                service: '${service}', 
                                reason: 'User canceled authorization' 
                            }, '*');
                        }
                        window.close();
                    }
                </script>
            </body>
        </html>
    `);
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server active on port ${PORT}`));
