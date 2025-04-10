// wine-quality-backend/config/db.config.js
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env'}); // Load .env variables
const fs = require('fs'); // Require the file system module
const path = require('path'); // Require path module

// --- SSL Configuration ---
let sslConfig = null;
const useSSL = process.env.DB_SSL_ENABLED === 'true'; // Add DB_SSL_ENABLED=true to .env if needed

if (useSSL) {
    const caPath = path.resolve(__dirname, '..', 'certs', process.env.DB_SSL_CA_CERT_FILENAME); // Adjust path/filename
    console.log(`Attempting to load CA certificate from: ${caPath}`); // Debug log

    if (fs.existsSync(caPath)) {
         sslConfig = {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false', // Default to true (secure)
            ca: fs.readFileSync(caPath).toString(),
         };
         console.log('SSL Configuration Enabled.');
    } else {
        console.error(`ERROR: SSL CA Certificate not found at path: ${caPath}`);
        console.warn('Proceeding without SSL configuration despite DB_SSL_ENABLED=true');
        // Decide if you want to exit or just warn:
        // process.exit(1);
    }
} else {
     console.log('SSL Configuration Disabled (DB_SSL_ENABLED is not true in .env).');
}
// --- End SSL Configuration ---


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: sslConfig, // Use the sslConfig object here (will be null if SSL is disabled)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis:20000,
  max: 30,
});

pool.on('connect', (client) => { // Changed event handler slightly for clarity
  console.log(`Database connection pool created. Client connected. SSL: ${client.ssl ? 'Enabled' : 'Disabled'}`);
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};