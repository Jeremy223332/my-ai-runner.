const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('AI Runner Server is Active!');
});

app.post('/run', (req, res) => {
    const { script } = req.body;
    console.log('Received payload script:', script);
    res.json({ status: 'success', message: 'Script received by cloud runner.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server active on port ${PORT}`));
