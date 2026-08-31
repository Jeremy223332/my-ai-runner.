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

// Helper function to create Google OAuth Client
function getYouTubeOAuthClient() {
    return new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        `${process.env.BASE_URL || 'https://my-ai-runner-daaa8l142hec739v8org.onrender.com'}/auth/youtube/callback`
    );
}

// 1. Direct YouTube Authorization Route (Triggers Google Sign-In)
app.get('/auth/youtube', (req, res) => {
    try {
        const oauth2Client = getYouTubeOAuthClient();
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/youtube.readonly',
                'https://www.googleapis.com/auth/userinfo.profile'
            ]
        });
        res.redirect(authUrl);
    } catch (err) {
        res.status(500).send('Error generating YouTube auth URL: ' + err.message);
    }
});

// 2. YouTube OAuth Callback Handler
app.get('/auth/youtube/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('No authorization code provided.');

    try {
        const oauth2Client = getYouTubeOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const channelRes = await youtube.channels.list({
            mine: true,
            part: ['snippet']
        });

        const channel = channelRes.data.items?.[0]?.snippet;
        const displayName = channel ? channel.title : 'YouTube User';
        const avatarUrl = channel ? channel.thumbnails.default.url : '';

        res.send(`
            <!DOCTYPE html>
            <html>
            <body style="background: #111827; color: white; font-family: sans-serif; text-align: center; padding: 40px;">
                <h2>Authenticated with YouTube!</h2>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            status: 'connected',
                            service: 'YouTube',
                            user: {
                                displayName: "${displayName}",
                                avatarUrl: "${avatarUrl}"
                            }
                        }, '*');
                    }
                    window.close();
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('OAuth Callback Error:', error);
        res.status(500).send('Authentication failed: ' + error.message);
    }
});

// 3. Dynamic Fallback Route for Other Services
app.get('/auth/:service', (req, res) => {
    const service = req.params.service;
    res.send(`<h2>Authorization page for ${service}</h2>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server active on port ${PORT}`));
