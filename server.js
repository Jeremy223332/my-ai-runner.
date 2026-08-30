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
