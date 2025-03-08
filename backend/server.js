const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { findMinCostPath, findMinTimePath } = require('./minPath');

const app = express();
const port = 3001;

// MongoDB connection URL
const url = "mongodb://localhost:27017/hclDB";

// Middleware
app.use(cors());
app.use(express.json());

// API Endpoints
app.get('/api/banks', async (req, res) => {
    try {
        const client = await MongoClient.connect(url);
        const db = client.db();
        const banks = await db.collection("Banks").find({}).toArray();
        await client.close();
        console.log(`Fetched ${banks.length} banks`);
        res.json(banks);
    } catch (error) {
        console.error('Error fetching banks:', error);
        res.status(500).json({ error: 'Failed to fetch banks' });
    }
});

app.post('/api/findPath', async (req, res) => {
    try {
        const { sourceBIC, destBIC, routeType } = req.body;

        // Validate input
        if (!sourceBIC || !destBIC) {
            return res.status(400).json({ 
                error: 'Source and destination BICs are required' 
            });
        }

        let result;
        if (routeType === 'time') {
            result = await findMinTimePath(sourceBIC, destBIC);
        } else {
            result = await findMinCostPath(sourceBIC, destBIC);
        }

        console.log('Path finding result:', result);

        if (!result.path.length) {
            return res.status(404).json({
                error: 'No valid path found between the specified banks'
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error finding path:', error);
        res.status(500).json({ error: 'Failed to find path' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('Try the health check at http://localhost:${port}/api/health');
});