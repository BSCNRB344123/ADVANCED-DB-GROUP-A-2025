// server.js
require('dotenv').config(); // Load .env variables at the very top
const express = require('express');
const cors = require('cors');
const wineRoutes = require('./routes/wine.routes');
const setupSwagger = require('./config/swagger'); // Import Swagger setup

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- API Routes ---
app.get('/', (req, res) => { // Basic root route
    res.send('Welcome to the Wine Quality API! Visit /api-docs for documentation.');
});
app.use('/api/wines', wineRoutes); // Mount wine routes under /api/wines

// --- Swagger Documentation Setup ---
setupSwagger(app); // Call the function to set up Swagger UI

// --- Basic Error Handling ---
// 404 Not Found handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found', message: `The requested URL ${req.originalUrl} was not found on this server.` });
});

// General error handler (must be last middleware)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack || err); // Log the full error stack
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred.',
        // Optionally include stack in development mode
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Verify DB connection details (optional sanity check)
    console.log(`Attempting to connect to DB: ${process.env.DB_DATABASE} on ${process.env.DB_HOST}:${process.env.DB_PORT} as ${process.env.DB_USER}`);
    // Consider adding a check here to see if the DB pool can connect initially.
});

// Graceful shutdown handling (optional but good practice)
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => { // Use app.close() if you assigned the listen result to 'app'
        console.log('HTTP server closed');
        // Close database pool here if needed (e.g., db.pool.end())
        process.exit(0);
    });
});