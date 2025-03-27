// api.js - API service for feedback system
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const FeedbackAPI = {
    // Get feedback items with optional filters
    getFeedbackItems: async (filters = {}) => {
        const { schema, feedback, showHidden, search, limit } = filters;

        // Build query parameters
        const params = new URLSearchParams();
        if (schema) params.append('schema', schema);
        if (feedback) params.append('feedback', feedback);
        if (showHidden) params.append('showHidden', 'true');
        if (search) params.append('search', search);
        if (limit) params.append('limit', limit.toString());

        const response = await fetch(`${API_URL}/feedback?${params}`);
        if (!response.ok) throw new Error('Network response was not ok');

        return response.json();
    },

    // Update feedback status (positive/negative)
    updateFeedback: async (id, feedbackValue) => {
        const response = await fetch(`${API_URL}/feedback/${id}/feedback`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ feedback: feedbackValue }),
        });

        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    },

    // Archive/unarchive an item
    updateHiddenStatus: async (id, hidden) => {
        const response = await fetch(`${API_URL}/feedback/${id}/hidden`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hidden }),
        });

        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    },

    // Seed the database with test data (for development)
    seedDatabase: async () => {
        const response = await fetch(`${API_URL}/seed`, {
            method: 'POST',
        });

        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    }
};

export default FeedbackAPI;