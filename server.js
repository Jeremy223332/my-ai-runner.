// Dynamic OAuth Authorization Route with Profile Display
app.get('/auth/:service', (req, res) => {
    const service = req.params.service;
    
    // Default fallback user profile details (Replace with real OAuth user data when using live API keys)
    const mockUser = {
        displayName: "Jeremiah",
        username: "@JeremiahUser",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Jeremiah"
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
                    button:hover { opacity: 0.9; }
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
