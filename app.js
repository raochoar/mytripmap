const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

const dataFilePath = path.join(__dirname, 'visitedCountries.json');

// Middleware to parse JSON and serve static files
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API to save the state
app.post('/save', (req, res) => {
    const visitedCountries = req.body.visitedCountries || [];
    fs.writeFileSync(dataFilePath, JSON.stringify(visitedCountries, null, 2), 'utf8');
    res.json({ message: 'State saved successfully' });
});

// API to load the state
app.get('/load', (req, res) => {
    if (fs.existsSync(dataFilePath)) {
        const visitedCountries = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        res.json({ visitedCountries });
    } else {
        res.json({ visitedCountries: [] });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});