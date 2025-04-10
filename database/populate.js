// database/populate.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../wine-quality-backend/.env') }); // Load .env from node_backend
const fs = require('fs');
const { Pool } = require('pg');
const csv = require('csv-parser');

console.log('--- DEBUG ---');
console.log(`Attempting to read from .env path: ${path.resolve(__dirname, '../wine-quality-backend/.env')}`);
console.log(`DB_USER read: '${process.env.DB_USER}'`);
console.log(`DB_PASSWORD read: '${process.env.DB_PASSWORD}'`);
console.log(`Type of DB_PASSWORD: ${typeof process.env.DB_PASSWORD}`);
console.log('--- END DEBUG ---');

console.log('--- DEBUG BEFORE POOL CREATION ---');
const dbConfigForPool = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: false,
};
console.log(`Config being passed to Pool`);
console.log(JSON.stringify(dbConfigForPool, null, 2));
console.log('Type of password in config:', typeof dbConfigForPool.password);
console.log('--- END DEBUG BEFORE POOL CREATION ---');

const pool = new Pool(dbConfigForPool);

const RED_WINE_FILE = path.join(__dirname, '..', 'data', 'winequality-red.csv');
const WHITE_WINE_FILE = path.join(__dirname, '..', 'data', 'winequality-white.csv');
// const TARGET_RECORDS = 10000; // We might exceed this naturally, removing duplication logic for now

// Helper function to process a single CSV file
function processFile(filePath, wineType, recordsArray) {
  return new Promise((resolve, reject) => {
    console.log(`Starting processing of ${wineType} wine file: ${filePath}`);
    let fileRecordCount = 0;
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' })) // Both files use semicolon separator
      .on('data', (row) => {
        const formattedRow = { wine_type: wineType }; // Add wine type
        for (const key in row) {
          const newKey = key.toLowerCase().replace(/ /g, '_');
          const value = row[key] === '' ? null : Number(row[key]);
          if (isNaN(value) && row[key] !== null && row[key] !== '') {
            console.warn(`Warning [${wineType}]: Could not parse numeric value for key "${key}", value "${row[key]}". Setting to null.`);
            formattedRow[newKey] = null;
          } else {
            formattedRow[newKey] = value;
          }
        }

        // Basic validation (ensure quality exists and is reasonable)
        if (formattedRow.quality !== null && formattedRow.quality >= 0 && formattedRow.quality <= 10) {
            // Ensure all expected columns exist (important if one CSV has slightly different headers)
            const expectedCols = [
                'fixed_acidity', 'volatile_acidity', 'citric_acid', 'residual_sugar',
                'chlorides', 'free_sulfur_dioxide', 'total_sulfur_dioxide', 'density',
                'ph', 'sulphates', 'alcohol', 'quality'
            ];
             expectedCols.forEach(col => {
                if (!(col in formattedRow)) {
                    formattedRow[col] = null; // Add missing columns as null
                }
            });
             recordsArray.push(formattedRow);
             fileRecordCount++;
        } else {
          console.warn(`Skipping row in ${wineType} file due to invalid or missing quality: ${JSON.stringify(row)}`);
        }
      })
      .on('end', () => {
        console.log(`${wineType} wine file processing complete. Found ${fileRecordCount} valid records.`);
        resolve(); // Resolve the promise when done reading
      })
      .on('error', (error) => {
        console.error(`Error reading ${wineType} wine file: ${filePath}`, error);
        reject(error); // Reject the promise on error
      });
  });
}


async function populateData() {
  let client; // Define client outside try block for access in finally
  console.log('Attempting to connect to database (populateData)...');
  try {
    client = await pool.connect();
    console.log('Connected to database (populateData).');

    // Optional: Clear existing data
    console.log('Clearing existing data from wines and related tables...');
    await client.query('TRUNCATE TABLE wines RESTART IDENTITY CASCADE');
    // CASCADE will also truncate wine_audit_log if it has FK refs,
    // but explicit truncate is safer if FKs aren't set up yet.
    await client.query('TRUNCATE TABLE wine_audit_log RESTART IDENTITY CASCADE');
    console.log('Existing data cleared.');

    const allRecords = []; // Array to hold records from both files

    // Process both files concurrently and wait for them to finish
    console.log('Processing CSV files...');
    await Promise.all([
        processFile(RED_WINE_FILE, 'red', allRecords),
        processFile(WHITE_WINE_FILE, 'white', allRecords)
    ]);

    console.log(`Total valid records read from both files: ${allRecords.length}`);

    if (allRecords.length === 0) {
      console.error("No valid records found in either CSV file. Aborting population.");
      return; // Exit if no data
    }


    console.log(`Starting bulk insert of ${allRecords.length} records...`);
    // Use transactional insert
    await client.query('BEGIN');
    let insertedCount = 0;
    try {
      // Prepare the query text once
       const queryText = `
        INSERT INTO wines (
            wine_type, fixed_acidity, volatile_acidity, citric_acid, residual_sugar,
            chlorides, free_sulfur_dioxide, total_sulfur_dioxide, density, ph,
            sulphates, alcohol, quality
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      for (const record of allRecords) {
        const values = [
            record.wine_type, // New value
            record.fixed_acidity, record.volatile_acidity, record.citric_acid, record.residual_sugar,
            record.chlorides, record.free_sulfur_dioxide, record.total_sulfur_dioxide, record.density,
            record.ph, record.sulphates, record.alcohol, record.quality
        ];
        await client.query(queryText, values);
        insertedCount++;
        if (insertedCount % 1000 === 0 || insertedCount === allRecords.length) {
          console.log(`Inserted ${insertedCount}/${allRecords.length}...`);
        }
      }
      await client.query('COMMIT');
      console.log(`Successfully inserted ${insertedCount} records.`);
    } catch (insertError) {
      await client.query('ROLLBACK');
      console.error('Error during bulk insert, rolling back transaction:', insertError);
      // Log the record that might have caused the issue (if identifiable)
      // console.error('Problematic record might be near index:', insertedCount);
      throw insertError; // Rethrow to be caught by outer catch
    }

  } catch (error) {
    console.error('Error during data population process:', error);
  } finally {
    if (client) {
        await client.release();
        console.log('Database client released.');
    }
    await pool.end(); // Close the pool
    console.log('Connection pool closed.');
  }
}

// Execute the population script
populateData();