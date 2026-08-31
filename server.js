const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Track connected service states
let connectedServices = {
    discord: false,
    google: false
};

app.get('/', (req, res) => {
    res.send('AI Runner Server Active');
});

// 1. Redirect user to official Discord OAuth2 prompt
app.get('/auth/discord', (req, res) => {
    const CLIENT_ID = '1543773602795757638';
    const REDIRECT_URI = encodeURIComponent('https://my-ai-runner.onrender.com/auth/discord/callback');
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20bot`;
    
    res.redirect(discordAuthUrl);
});

// 2. Handle approval callback from Discord
app.get('/auth/discord/callback', (req, res) => {
    const { code } = req.query;
    
    if (code) {
        connectedServices.discord = true;
        res.send(`
            <html>
                <body style="background:#090d16;color:#10b981;font-family:sans-serif;text-align:center;padding-top:50px;">
                    <h2>✅ Successfully Authorized!</h2>
                    <p>You can close this tab and return to your Studio workspace.</p>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ service: 'discord', status: 'connected' }, '*');
                            setTimeout(() => window.close(), 1500);
                        }
                    </script>
                </body>
            </html>
        `);
    } else {
        res.status(400).send('Authorization was canceled or failed.');
    }
});

// Check status endpoint
app.get('/auth/status', (req, res) => {
    res.json(connectedServices);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
