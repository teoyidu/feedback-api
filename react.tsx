import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown, X, Filter, Search, MessageSquare, XCircle } from 'lucide-react';

// API URL (move to .env in production)
const API_URL = 'http://localhost:5000/api';

// Conversation Dialog Component
const ConversationDialog = ({ isOpen, onClose, conversation, title }) => {
    const dialogRef = useRef(null);
    const contentRef = useRef(null);

    // Handle click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (dialogRef.current && !dialogRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Scroll to bottom on open
    useEffect(() => {
        if (isOpen && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [isOpen, conversation]);

    // ESC key to close
    useEffect(() => {
        if (!isOpen) return;

        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
                ref={dialogRef}
                className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col shadow-xl"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-lg font-medium text-white flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div
                    ref={contentRef}
                    className="overflow-y-auto p-4 flex-grow"
                >
                    {conversation && conversation.map((item, index) => (
                        <div
                            key={index}
                            className={`mb-4 ${item.role === 'user' ? 'text-right' : 'text-left'}`}
                        >
                            <div
                                className={`inline-block max-w-[80%] p-3 rounded-lg ${
                                    item.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-700 text-white rounded-tl-none'
                                }`}
                            >
                                <p className="text-sm font-medium mb-1 opacity-70">
                                    {item.role === 'user' ? 'User' : 'Assistant'}
                                </p>
                                <p className="whitespace-pre-line">{item.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FeedbackSystem = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [activeSchema, setActiveSchema] = useState(null);
    const [activeFeedbackFilter, setActiveFeedbackFilter] = useState(null);
    const [showHidden, setShowHidden] = useState(false);
    const [pageSize, setPageSize] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeConversation, setActiveConversation] = useState(null);
    const [animatedFeedback, setAnimatedFeedback] = useState(null);
    const [uniqueSchemas, setUniqueSchemas] = useState([]);

    // Fetch data from MongoDB API
    const fetchData = async () => {
        setLoading(true);
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (activeSchema) params.append('schema', activeSchema);
            if (activeFeedbackFilter) params.append('feedback', activeFeedbackFilter);
            if (showHidden) params.append('showHidden', 'true');
            if (searchQuery) params.append('search', searchQuery);
            params.append('limit', pageSize.toString());

            const response = await fetch(`${API_URL}/feedback?${params}`);
            if (!response.ok) throw new Error('Network response was not ok');

            const result = await response.json();
            setData(result);
            setFilteredData(result);
            setLoading(false);

            // Extract unique schemas for filter buttons
            const schemas = [...new Set(result.map(item => item.schema))];
            setUniqueSchemas(schemas);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Please try again.');
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, []);

    // Refetch when filters change
    useEffect(() => {
        fetchData();
    }, [activeSchema, activeFeedbackFilter, showHidden, searchQuery, pageSize]);

    // Filter data based on selected schema
    const filterBySchema = (schema) => {
        if (activeSchema === schema) {
            setActiveSchema(null);
        } else {
            setActiveSchema(schema);
        }
    };

    // Filter by feedback status
    const filterByFeedback = (feedbackType) => {
        if (activeFeedbackFilter === feedbackType) {
            setActiveFeedbackFilter(null);
        } else {
            setActiveFeedbackFilter(feedbackType);
        }
    };

    // Toggle showing hidden items
    const toggleHidden = () => {
        setShowHidden(!showHidden);
    };

    // Handle search functionality
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
    };

    // Handle opening the conversation dialog
    const handleOpenConversation = (item) => {
        setActiveConversation(item);
        setDialogOpen(true);
    };

    // Handle closing the conversation dialog
    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    // Feedback handlers
    const handlePositiveFeedback = async (id, e) => {
        // Stop propagation to prevent dialog from opening
        e.stopPropagation();

        // Trigger animation
        setAnimatedFeedback({ id, type: 'positive' });
        setTimeout(() => setAnimatedFeedback(null), 1000);

        try {
            // Update in MongoDB via API
            const response = await fetch(`${API_URL}/feedback/${id}/feedback`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ feedback: 'positive' }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            // Update local state
            setData(data.map(item => {
                if (item._id === id) {
                    return { ...item, feedback: 'positive' };
                }
                return item;
            }));

            console.log(`Added to positive chats list: ${id}`);
        } catch (err) {
            console.error('Error updating feedback:', err);
            // Optionally show error toast/notification
        }
    };

    const handleNegativeFeedback = async (id, e) => {
        // Stop propagation to prevent dialog from opening
        e.stopPropagation();

        // Trigger animation
        setAnimatedFeedback({ id, type: 'negative' });
        setTimeout(() => setAnimatedFeedback(null), 1000);

        try {
            // Update in MongoDB via API
            const response = await fetch(`${API_URL}/feedback/${id}/feedback`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ feedback: 'negative' }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            // Update local state
            setData(data.map(item => {
                if (item._id === id) {
                    return { ...item, feedback: 'negative' };
                }
                return item;
            }));

            console.log(`Added to negative chats list: ${id}`);
        } catch (err) {
            console.error('Error updating feedback:', err);
            // Optionally show error toast/notification
        }
    };

    const handleRemove = async (id, e) => {
        // Stop propagation to prevent dialog from opening
        e.stopPropagation();

        try {
            // Update in MongoDB via API
            const response = await fetch(`${API_URL}/feedback/${id}/hidden`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ hidden: true }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            // Update local state
            setData(data.map(item => {
                if (item._id === id) {
                    return { ...item, hidden: true };
                }
                return item;
            }));

            console.log(`Marked as hidden: ${id}`);
        } catch (err) {
            console.error('Error updating hidden status:', err);
            // Optionally show error toast/notification
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <div className="bg-gray-900 text-gray-100 min-h-screen p-6">
            <h1 className="text-2xl font-bold mb-6">AI Chatbot Feedback System</h1>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="w-full pl-10 p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search questions or queries..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>

            {/* Schema Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                <div className="flex items-center mr-2">
                    <Filter className="w-4 h-4 mr-1" />
                    <span>Schema Filters:</span>
                </div>
                {uniqueSchemas.map(schema => (
                    <button
                        key={schema}
                        onClick={() => filterBySchema(schema)}
                        className={`px-3 py-1 rounded-full text-sm ${
                            activeSchema === schema
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {schema}
                    </button>
                ))}
            </div>

            {/* Feedback Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6 border-t border-gray-700 pt-4">
                <div className="flex items-center mr-2">
                    <span>Feedback Filters:</span>
                </div>
                <button
                    onClick={() => filterByFeedback('positive')}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${
                        activeFeedbackFilter === 'positive'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Positive
                </button>
                <button
                    onClick={() => filterByFeedback('negative')}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${
                        activeFeedbackFilter === 'negative'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    Negative
                </button>
                <button
                    onClick={toggleHidden}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${
                        showHidden
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                    {showHidden ? 'Hide Archived' : 'Show Archived'}
                </button>
            </div>

            {/* Page Size Selection */}
            <div className="flex gap-2 mb-6">
                <span>Show:</span>
                {[20, 40, 100, 200].map(size => (
                    <button
                        key={size}
                        onClick={() => setPageSize(size)}
                        className={`px-3 py-1 rounded text-sm ${
                            pageSize === size
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>

            {/* Display number of results */}
            <div className="mb-4 text-gray-400">
                Showing {filteredData.length} results
            </div>

            {/* Feedback Items */}
            <div className="space-y-4">
                {filteredData.map(item => (
                    <div
                        key={item._id}
                        className={`p-4 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors relative ${
                            item.hidden ? 'bg-gray-900 border border-gray-700' : 'bg-gray-800'
                        } ${
                            item.feedback === 'positive' ? 'border-l-4 border-l-green-500' :
                                item.feedback === 'negative' ? 'border-l-4 border-l-red-500' : ''
                        }`}
                        onClick={() => handleOpenConversation(item)}
                    >
                        {/* Feedback animation overlay */}
                        {animatedFeedback && animatedFeedback.id === item._id && (
                            <div className={`absolute inset-0 rounded-lg flex items-center justify-center bg-opacity-30 ${
                                animatedFeedback.type === 'positive' ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                                {animatedFeedback.type === 'positive' ? (
                                    <ThumbsUp className="w-16 h-16 text-green-400 animate-pulse" />
                                ) : (
                                    <ThumbsDown className="w-16 h-16 text-red-400 animate-pulse" />
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-start">
                            <div className="flex-grow">
                                <div className="flex flex-wrap gap-2 mb-1">
                  <span className="bg-gray-700 text-xs font-medium px-2.5 py-0.5 rounded">
                    {item.schema}
                  </span>

                                    {item.feedback === 'positive' && (
                                        <span className="bg-green-900 text-green-300 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                      <ThumbsUp className="w-3 h-3 mr-1" /> Positive
                    </span>
                                    )}

                                    {item.feedback === 'negative' && (
                                        <span className="bg-red-900 text-red-300 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                      <ThumbsDown className="w-3 h-3 mr-1" /> Negative
                    </span>
                                    )}

                                    {item.hidden && (
                                        <span className="bg-purple-900 text-purple-300 text-xs font-medium px-2.5 py-0.5 rounded">
                      Archived
                    </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-medium mt-1">{item.question}</h3>
                                <p className="text-gray-400 text-sm mt-1">Query: {item.query}</p>
                                <div className="mt-2 flex items-center text-xs text-gray-500">
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    {item.conversation?.length || 0} messages
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={(e) => handlePositiveFeedback(item._id, e)}
                                    className={`p-1.5 rounded-full hover:bg-gray-700 ${
                                        item.feedback === 'positive' ? 'bg-green-800 bg-opacity-50' : ''
                                    }`}
                                    title="Positive Feedback"
                                >
                                    <ThumbsUp className="w-5 h-5 text-green-400" />
                                </button>
                                <button
                                    onClick={(e) => handleNegativeFeedback(item._id, e)}
                                    className={`p-1.5 rounded-full hover:bg-gray-700 ${
                                        item.feedback === 'negative' ? 'bg-red-800 bg-opacity-50' : ''
                                    }`}
                                    title="Negative Feedback"
                                >
                                    <ThumbsDown className="w-5 h-5 text-red-400" />
                                </button>
                                <button
                                    onClick={(e) => handleRemove(item._id, e)}
                                    className={`p-1.5 rounded-full hover:bg-gray-700 ${
                                        item.hidden ? 'bg-purple-800 bg-opacity-50' : ''
                                    }`}
                                    title={item.hidden ? 'Archived' : 'Archive'}
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Conversation Dialog */}
            <ConversationDialog
                isOpen={dialogOpen}
                onClose={handleCloseDialog}
                conversation={activeConversation?.conversation}
                title={activeConversation?.question}
            />

            {/* No results message */}
            {filteredData.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    No questions found matching your criteria
                </div>
            )}
        </div>
    );
};

export default FeedbackSystem;