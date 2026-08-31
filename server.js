const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Track active bot instances in memory
let activeBotClient = null;

app.get('/', (req, res) => {
    res.send('AI Runner Server is Active!');
});

// Endpoint to start a Discord Bot using a token from the website
app.post('/start-bot', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ status: 'error', message: 'No bot token provided.' });
    }

    try {
        // Destroy existing bot connection if one is already running
        if (activeBotClient) {
            await activeBotClient.destroy();
        }

        // Initialize a new Discord Client
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        client.once('ready', () => {
            console.log(`Bot successfully logged in as ${client.user.tag}`);
        });

        client.on('messageCreate', (message) => {
            if (message.author.bot) return;
            if (message.content === '!ping') {
                message.reply('Pong! Bot is active via custom studio backend.');
            }
        });

        // Log in using the token sent from the website
        await client.login(token);
        activeBotClient = client;

        res.json({ 
            status: 'success', 
            message: `Bot connected successfully as ${client.user.tag}` 
        });

    } catch (err) {
        console.error('Failed to log in Discord bot:', err.message);
        res.status(500).json({ 
            status: 'error', 
            message: `Invalid token or login failure: ${err.message}` 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server active on port ${PORT}`));
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory session state (for demonstration)
let connectedServices = {
    discord: false,
    google: false
};

app.get('/', (req, res) => {
    res.send('AI Runner Server Active');
});

// 1. Trigger OAuth Redirect for Discord
app.get('/auth/discord', (req, res) => {
    // Replace CLIENT_ID and REDIRECT_URI with your registered developer app details
    const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
    const REDIRECT_URI = encodeURIComponent('https://my-ai-runner.onrender.com/auth/discord/callback');
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20bot`;
    
    res.redirect(discordAuthUrl);
});

// 2. Handle OAuth Callback from Discord
app.get('/auth/discord/callback', (req, res) => {
    const { code } = req.query;
    
    if (code) {
        connectedServices.discord = true;
        // Redirect back to your local studio page with a success flag
        res.send(`
            <html>
                <body style="background:#090d16;color:#10b981;font-family:sans-serif;text-align:center;padding-top:50px;">
                    <h2>✅ Successfully Authorized!</h2>
                    <p>You can close this tab and return to your Studio.</p>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ service: 'discord', status: 'connected' }, '*');
                            setTimeout(() => window.close(), 2000);
                        }
                    </script>
                </body>
            </html>
        `);
    } else {
        res.status(400).send('Authorization failed or was canceled.');
    }
});

// Check status from studio page
app.get('/auth/status', (req, res) => {
    res.json(connectedServices);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
