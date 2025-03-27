const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Feedback = require('./models/Feedback');

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes

// Get all feedback items with filtering
app.get('/api/feedback', async (req, res) => {
    try {
        const { schema, feedback, showHidden, search, limit = 20 } = req.query;

        // Build query
        let query = {};

        if (schema) {
            query.schema = schema;
        }

        if (feedback) {
            query.feedback = feedback;
        }

        if (showHidden !== 'true') {
            query.hidden = false;
        }

        if (search) {
            query.$or = [
                { question: { $regex: search, $options: 'i' } },
                { query: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await Feedback.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(items);
    } catch (err) {
        console.error('Error fetching feedback:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/test', (req, res) => {
    res.send('API is working');
});
// Update feedback status
app.patch('/api/feedback/:id/feedback', async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;

        const updatedItem = await Feedback.findByIdAndUpdate(
            id,
            { feedback },
            { new: true }
        );

        res.json(updatedItem);
    } catch (err) {
        console.error('Error updating feedback:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Archive/unarchive item
app.patch('/api/feedback/:id/hidden', async (req, res) => {
    try {
        const { id } = req.params;
        const { hidden } = req.body;

        const updatedItem = await Feedback.findByIdAndUpdate(
            id,
            { hidden },
            { new: true }
        );

        res.json(updatedItem);
    } catch (err) {
        console.error('Error updating hidden status:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Insert test data if needed
// Replace your seed endpoint with this:
app.post('/api/seed', async (req, res) => {
    console.log('Seed route hit');
    try {
        // Example seed data
        const seedData = [
            {
                schema: 'mesai',
                question: 'bu haftaki çalışma süremi getir',
                query: 'Bu hafta toplamda 35.3 saat çalıştınız',
                feedback: null,
                hidden: false,
                conversation: [
                    { role: 'user', message: 'bu haftaki çalışma süremi getir' },
                    { role: 'assistant', message: 'isteğinizi işleme alıyorum. ' },
                    { role: 'assistant', message: 'Bu hafta toplamda 35.3 saat çalıştınız.' }
                ]
            }
        ];

        console.log('About to insert seed data');
        const result = await Feedback.insertMany(seedData);
        console.log('Seed result:', result);
        res.json({ message: 'Seed data inserted successfully', count: result.length });
    } catch (err) {
        console.error('Error details:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Add this after other middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({ error: err.message });
});
// Add this route
app.get('/api/seed-get', async (req, res) => {
    try {
        await Feedback.insertMany([{
            schema: 'test',
            question: 'test',
            query: 'test',
            feedback: null,
            hidden: false,
            conversation: [{ role: 'user', message: 'test' }]
        }]);
        res.json({success: true});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: err.message});
    }
});
// Add this before the app.listen line
app.get('/'
    , (req, res) => {
    res.send('Feedback API is running! Use /api/feedback to access data.');
});
// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));