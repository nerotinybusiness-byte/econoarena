const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint to get all Marx mode scenarios
app.get('/api/marx/scenarios', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'scenarios-marx.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading scenarios file:', err);
            return res.status(500).json({ error: 'Failed to load scenarios' });
        }
        try {
            const scenarios = JSON.parse(data);
            res.json(scenarios);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ error: 'Failed to parse scenarios data' });
        }
    });
});

// API Endpoint to get a specific scenario by ID
app.get('/api/marx/scenario/:id', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'scenarios-marx.json');
    const scenarioId = req.params.id;

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading scenarios file:', err);
            return res.status(500).json({ error: 'Failed to load scenarios' });
        }
        try {
            const scenarios = JSON.parse(data);
            const scenario = scenarios.find(s => s.id === scenarioId);

            if (scenario) {
                res.json(scenario);
            } else {
                res.status(404).json({ error: 'Scenario not found' });
            }
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ error: 'Failed to parse scenarios data' });
        }
    });
});

// API Endpoint to get all Smith mode scenarios
app.get('/api/smith/scenarios', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'scenarios-smith.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            // If file doesn't exist yet, return empty array
            if (err.code === 'ENOENT') return res.json([]);
            console.error('Error reading scenarios file:', err);
            return res.status(500).json({ error: 'Failed to load scenarios' });
        }
        try {
            const scenarios = JSON.parse(data);
            res.json(scenarios);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ error: 'Failed to parse scenarios data' });
        }
    });
});

// API Endpoint to get all Hayek mode scenarios
app.get('/api/hayek/scenarios', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'scenarios-hayek.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            // If file doesn't exist yet, return empty array
            if (err.code === 'ENOENT') return res.json([]);
            console.error('Error reading scenarios file:', err);
            return res.status(500).json({ error: 'Failed to load scenarios' });
        }
        try {
            const scenarios = JSON.parse(data);
            res.json(scenarios);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ error: 'Failed to parse scenarios data' });
        }
    });
});

// API Endpoint to get all Keynes mode scenarios
app.get('/api/keynes/scenarios', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'scenarios-keynes.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') return res.json([]);
            console.error('Error reading scenarios file:', err);
            return res.status(500).json({ error: 'Failed to load scenarios' });
        }
        try {
            const scenarios = JSON.parse(data);
            res.json(scenarios);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ error: 'Failed to parse scenarios data' });
        }
    });
});

// API Endpoint to get all Friedman mode scenarios
app.get('/api/friedman/scenarios', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'scenarios-friedman.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') return res.json([]);
            console.error('Error reading scenarios file:', err);
            return res.status(500).json({ error: 'Failed to load scenarios' });
        }
        try {
            const scenarios = JSON.parse(data);
            res.json(scenarios);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ error: 'Failed to parse scenarios data' });
        }
    });
});

// Export the app for Vercel (Serverless)
module.exports = app;

// Only listen if run directly (local dev)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}
