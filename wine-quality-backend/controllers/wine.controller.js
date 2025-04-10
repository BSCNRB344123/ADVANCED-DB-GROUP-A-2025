// controllers/wineController.js
const db = require('../config/db.config');

// GET /api/wines - Get all wines (with basic pagination)
exports.getAllWines = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Default limit
    const offset = (page - 1) * limit;

    try {
        const countResult = await db.query('SELECT COUNT(*) FROM wines');
        const totalWines = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalWines / limit);

        const result = await db.query('SELECT * FROM wines ORDER BY id ASC LIMIT $1 OFFSET $2', [limit, offset]);

        res.status(200).json({
            data: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalWines,
                limit: limit
            }
        });
    } catch (err) {
        console.error("Error fetching wines:", err.message);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// GET /api/wines/:id - Get a specific wine by ID
exports.getWineById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM wines WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wine not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`Error fetching wine ${id}:`, err.message);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// POST /api/wines - Add a new wine
exports.createWine = async (req, res) => {
    const { wine_type, fixed_acidity, volatile_acidity, citric_acid, residual_sugar, chlorides, free_sulfur_dioxide, total_sulfur_dioxide, density, ph, sulphates, alcohol, quality } = req.body;

    // Basic validation
    if (quality === undefined || quality < 0 || quality > 10) {
        return res.status(400).json({ error: 'Invalid input: Quality must be between 0 and 10.' });
    }
    // Add more validation as needed for other fields

    const queryText = `
        INSERT INTO wines (wine_type, fixed_acidity, volatile_acidity, citric_acid, residual_sugar, chlorides, free_sulfur_dioxide, total_sulfur_dioxide, density, ph, sulphates, alcohol, quality)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;`; // RETURNING * sends back the newly created row
    const values = [wine_type, fixed_acidity, volatile_acidity, citric_acid, residual_sugar, chlorides, free_sulfur_dioxide, total_sulfur_dioxide, density, ph, sulphates, alcohol, quality];

    try {
        const result = await db.query(queryText, values);
        res.status(201).json(result.rows[0]); // 201 Created
    } catch (err) {
        console.error("Error creating wine:", err.message);
        // Check for specific DB errors if needed (e.g., constraint violations)
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// PUT /api/wines/:id - Update an existing wine
exports.updateWine = async (req, res) => {
    const { id } = req.params;
    // Only update fields provided in the body
    const { wine_type, fixed_acidity, volatile_acidity, citric_acid, residual_sugar, chlorides, free_sulfur_dioxide, total_sulfur_dioxide, density, ph, sulphates, alcohol, quality } = req.body;

    // Construct the SET part of the query dynamically
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (wine_type != undefined) { fields.push(`wine_type = $${paramIndex++}`); values.push(wine_type); }
    if (fixed_acidity !== undefined) { fields.push(`fixed_acidity = $${paramIndex++}`); values.push(fixed_acidity); }
    if (volatile_acidity !== undefined) { fields.push(`volatile_acidity = $${paramIndex++}`); values.push(volatile_acidity); }
    if (citric_acid !== undefined) { fields.push(`citric_acid = $${paramIndex++}`); values.push(citric_acid); }
    if (residual_sugar !== undefined) { fields.push(`residual_sugar = $${paramIndex++}`); values.push(residual_sugar); }
    if (chlorides !== undefined) { fields.push(`chlorides = $${paramIndex++}`); values.push(chlorides); }
    if (free_sulfur_dioxide !== undefined) { fields.push(`free_sulfur_dioxide = $${paramIndex++}`); values.push(free_sulfur_dioxide); }
    if (total_sulfur_dioxide !== undefined) { fields.push(`total_sulfur_dioxide = $${paramIndex++}`); values.push(total_sulfur_dioxide); }
    if (density !== undefined) { fields.push(`density = $${paramIndex++}`); values.push(density); }
    if (ph !== undefined) { fields.push(`ph = $${paramIndex++}`); values.push(ph); }
    if (sulphates !== undefined) { fields.push(`sulphates = $${paramIndex++}`); values.push(sulphates); }
    if (alcohol !== undefined) { fields.push(`alcohol = $${paramIndex++}`); values.push(alcohol); }
    if (quality !== undefined) {
        if (quality < 0 || quality > 10) {
             return res.status(400).json({ error: 'Invalid input: Quality must be between 0 and 10.' });
        }
        fields.push(`quality = $${paramIndex++}`); values.push(quality);
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields provided for update.' });
    }

    // Add the ID to the end of the values array for the WHERE clause
    values.push(id);
    const queryText = `UPDATE wines SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *;`;

    try {
        const result = await db.query(queryText, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wine not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(`Error updating wine ${id}:`, err.message);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// DELETE /api/wines/:id - Delete a wine
exports.deleteWine = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if wine exists before deleting (optional but good practice)
        const checkResult = await db.query('SELECT id FROM wines WHERE id = $1', [id]);
         if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Wine not found' });
        }

        await db.query('DELETE FROM wines WHERE id = $1', [id]);
        // No Content response
        res.status(204).send();
    } catch (err) {
        console.error(`Error deleting wine ${id}:`, err.message);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// GET /api/wines/stats/average-quality - Example using Stored Procedure
exports.getAverageQualityByAlcohol = async (req, res) => {
    const minAlcohol = parseFloat(req.query.min_alcohol) || 0.0; // Default to 0 if not provided or invalid

    if (isNaN(minAlcohol)) {
         return res.status(400).json({ error: 'Invalid query parameter: min_alcohol must be a number.' });
    }

    try {
        // Call the stored procedure created in optimizations.sql
        const result = await db.query('SELECT calculate_average_quality($1) as average_quality', [minAlcohol]);

        if (result.rows.length > 0 && result.rows[0].average_quality !== null) {
            res.status(200).json({ average_quality: parseFloat(result.rows[0].average_quality).toFixed(2) });
        } else {
             res.status(200).json({ average_quality: null, message: 'No wines found matching the criteria or calculation resulted in null.' });
        }
    } catch (err) {
        console.error("Error calling stored procedure calculate_average_quality:", err.message);
         // Check if the error indicates the function doesn't exist
        if (err.message.includes('function calculate_average_quality(real) does not exist')) {
             res.status(500).json({ error: 'Stored procedure not found. Ensure database/optimizations.sql has been executed.', details: err.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error calling stored procedure', details: err.message });
        }
    }
};