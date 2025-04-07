// config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wine Quality API (BCS4103 Project)',
      version: '1.0.0',
      description: `API documentation for the Advanced Database Systems project.
                    Manages wine quality data and demonstrates database optimization techniques
                    using PostgreSQL, Node.js, Stored Procedures, and Triggers.`,
      contact: {
        name: '[Your Group Name/Number]',
        // url: 'https://your-project-link.com', // Optional: Link to GitHub repo
        // email: 'your-group-email@example.com'  // Optional
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`, // Use env var or default
        description: 'Development server',
      },
      // Add OCI server URL when deployed
      // {
      //   url: 'YOUR_OCI_APP_URL',
      //   description: 'Production Server (OCI)',
      // }
    ],
     components: { // Define components here for reusability (moved from routes)
        // Schemas are now defined within the route file using JSDoc for better co-location,
        // but you could centralize complex ones here if preferred.
        // parameters: {} // Define common parameters like API keys if needed
     }
  },
  // Path to the API docs files (your route files with JSDoc comments)
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
    // Serve Swagger UI at /api-docs
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
         explorer: true, // Enables search bar
         // customCss: '.swagger-ui .topbar { display: none }' // Optional: hide top bar
    }));
     console.log(`Swagger docs available at http://localhost:${process.env.PORT || 3000}/api-docs`);
}

module.exports = setupSwagger;