const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    schema: String,
    question: String,
    query: String,
    feedback: { type: String, enum: ['positive', 'negative', null], default: null },
    hidden: { type: Boolean, default: false },
    conversation: [{
        role: { type: String, enum: ['user', 'assistant'] },
        message: String
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);