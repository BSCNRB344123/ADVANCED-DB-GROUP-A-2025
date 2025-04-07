// File: wine-quality-backend/routes/wine.routes.js

const express = require('express');
const wineController = require('../controllers/wine.controller.js'); // Correct path and filename
const router = express.Router();

// --- Swagger Schema Definition ---
// This large block defines reusable schemas and parameters used in the endpoint definitions below.
/**
 * @swagger
 * components:
 *   schemas:
 *     Wine:
 *       type: object
 *       required:
 *         - wine_type
 *         - quality
 *         - alcohol
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the wine record.
 *           readOnly: true
 *         wine_type:
 *           type: string
 *           enum: [red, white]
 *           description: The type of wine ('red' or 'white').
 *         fixed_acidity:
 *           type: number
 *           format: float
 *           description: Fixed acidity level.
 *         volatile_acidity:
 *           type: number
 *           format: float
 *           description: Volatile acidity level.
 *         citric_acid:
 *           type: number
 *           format: float
 *           description: Citric acid level.
 *         residual_sugar:
 *           type: number
 *           format: float
 *           description: Residual sugar level.
 *         chlorides:
 *           type: number
 *           format: float
 *           description: Chloride level.
 *         free_sulfur_dioxide:
 *           type: number
 *           format: float
 *           description: Free sulfur dioxide level.
 *         total_sulfur_dioxide:
 *           type: number
 *           format: float
 *           description: Total sulfur dioxide level.
 *         density:
 *           type: number
 *           format: float
 *           description: Density of the wine.
 *         ph:
 *           type: number
 *           format: float
 *           description: pH level.
 *         sulphates:
 *           type: number
 *           format: float
 *           description: Sulphate level.
 *         alcohol:
 *           type: number
 *           format: float
 *           description: Alcohol percentage.
 *         quality:
 *           type: integer
 *           description: Quality rating (0-10).
 *           minimum: 0
 *           maximum: 10
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was created.
 *           readOnly: true
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was last updated.
 *           readOnly: true
 *       example:
 *         id: 1
 *         wine_type: red
 *         fixed_acidity: 7.4
 *         volatile_acidity: 0.7
 *         citric_acid: 0
 *         residual_sugar: 1.9
 *         chlorides: 0.076
 *         free_sulfur_dioxide: 11
 *         total_sulfur_dioxide: 34
 *         density: 0.9978
 *         ph: 3.51
 *         sulphates: 0.56
 *         alcohol: 9.4
 *         quality: 5
 *         created_at: "2023-10-27T10:00:00.000Z"
 *         updated_at: "2023-10-27T10:00:00.000Z"
 *     NewWine:
 *       type: object
 *       required:
 *         - wine_type
 *         - quality
 *       properties:
 *         wine_type:
 *           type: string
 *           enum: [red, white]
 *         # Include all properties from Wine except readOnly ones (id, created_at, updated_at, is_premium)
 *         fixed_acidity:
 *           type: number
 *           format: float
 *         volatile_acidity:
 *           type: number
 *           format: float
 *         citric_acid:
 *           type: number
 *           format: float
 *         residual_sugar:
 *           type: number
 *           format: float
 *         chlorides:
 *           type: number
 *           format: float
 *         free_sulfur_dioxide:
 *           type: number
 *           format: float
 *         total_sulfur_dioxide:
 *           type: number
 *           format: float
 *         density:
 *           type: number
 *           format: float
 *         ph:
 *           type: number
 *           format: float
 *         sulphates:
 *           type: number
 *           format: float
 *         alcohol:
 *           type: number
 *           format: float
 *         quality:
 *           type: integer
 *           minimum: 0
 *           maximum: 10
 *       example:
 *         wine_type: white
 *         fixed_acidity: 8.1
 *         volatile_acidity: 0.5
 *         citric_acid: 0.2
 *         residual_sugar: 2.1
 *         chlorides: 0.08
 *         free_sulfur_dioxide: 15
 *         total_sulfur_dioxide: 45
 *         density: 0.9980
 *         ph: 3.4
 *         sulphates: 0.6
 *         alcohol: 10.1
 *         quality: 6
 *     UpdateWine:
 *       type: object
 *       properties:
 *          # All properties are optional for update
 *          wine_type:
 *            type: string
 *            enum: [red, white]
 *          fixed_acidity:
 *            type: number
 *            format: float
 *          volatile_acidity:
 *            type: number
 *            format: float
 *          citric_acid:
 *            type: number
 *            format: float
 *          residual_sugar:
 *            type: number
 *            format: float
 *          chlorides:
 *            type: number
 *            format: float
 *          free_sulfur_dioxide:
 *            type: number
 *            format: float
 *          total_sulfur_dioxide:
 *            type: number
 *            format: float
 *          density:
 *            type: number
 *            format: float
 *          ph:
 *            type: number
 *            format: float
 *          sulphates:
 *            type: number
 *            format: float
 *          alcohol:
 *            type: number
 *            format: float
 *          quality:
 *            type: integer
 *            minimum: 0
 *            maximum: 10
 *       example:
 *          quality: 7
 *          alcohol: 10.5
 *   parameters:
 *     WineIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *       description: The ID of the specific wine record.
 */

// --- API Endpoints ---

/**
 * @swagger
 * /api/wines:
 *   get:
 *     summary: Retrieve a list of wines
 *     tags: [Wines]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of items per page.
 *     responses:
 *       200:
 *         description: A list of wines with pagination info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wine'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       500:
 *         description: Internal Server Error
 */
router.get('/', wineController.getAllWines);

/**
 * @swagger
 * /api/wines/{id}:
 *   get:
 *     summary: Get a specific wine by ID
 *     tags: [Wines]
 *     parameters:
 *       - $ref: '#/components/parameters/WineIdParam'
 *     responses:
 *       200:
 *         description: Details of the specific wine.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wine'
 *       404:
 *         description: Wine not found.
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id', wineController.getWineById);

/**
 * @swagger
 * /api/wines:
 *   post:
 *     summary: Create a new wine record
 *     tags: [Wines]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewWine'
 *     responses:
 *       201:
 *         description: Wine record created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wine'
 *       400:
 *         description: Invalid input data.
 *       500:
 *         description: Internal Server Error
 */
router.post('/', wineController.createWine);

/**
 * @swagger
 * /api/wines/{id}:
 *   put:
 *     summary: Update an existing wine record
 *     tags: [Wines]
 *     parameters:
 *       - $ref: '#/components/parameters/WineIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWine' # Use a schema allowing partial updates
 *     responses:
 *       200:
 *         description: Wine record updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wine'
 *       400:
 *         description: Invalid input data or no fields to update.
 *       404:
 *         description: Wine not found.
 *       500:
 *         description: Internal Server Error
 */
router.put('/:id', wineController.updateWine);

/**
 * @swagger
 * /api/wines/{id}:
 *   delete:
 *     summary: Delete a wine record
 *     tags: [Wines]
 *     parameters:
 *       - $ref: '#/components/parameters/WineIdParam'
 *     responses:
 *       204:
 *         description: Wine record deleted successfully (No Content).
 *       404:
 *         description: Wine not found.
 *       500:
 *         description: Internal Server Error
 */
router.delete('/:id', wineController.deleteWine);

// --- Endpoint using Stored Procedure ---
/**
 * @swagger
 * /api/wines/stats/average-quality:
 *   get:
 *     summary: Calculate average quality for wines above a minimum alcohol level (uses Stored Procedure)
 *     tags: [Wines, Statistics, Optimization]
 *     parameters:
 *       - in: query
 *         name: min_alcohol
 *         schema:
 *           type: number
 *           format: float
 *           default: 0.0
 *         description: The minimum alcohol level to include in the average calculation.
 *     responses:
 *       200:
 *         description: The calculated average quality.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 average_quality:
 *                   type: number
 *                   format: float
 *                   nullable: true
 *                   description: The average quality rating, or null if no matching wines.
 *                 message:
 *                   type: string
 *                   description: Optional message if no wines match.
 *       400:
 *         description: Invalid query parameter.
 *       500:
 *         description: Internal Server Error (potentially stored procedure issue).
 */
router.get('/stats/average-quality', wineController.getAverageQualityByAlcohol);


// Export the router
module.exports = router;