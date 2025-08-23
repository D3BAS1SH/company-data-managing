import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

/**
 * Swagger Configuration
 *
 * This module sets up Swagger/OpenAPI documentation for the Express.js application.
 * It provides a comprehensive API documentation interface that is automatically
 * generated from JSDoc comments and OpenAPI specifications.
 *
 * Features:
 * - Auto-generated API documentation
 * - Interactive API testing interface
 * - Type definitions and schema validation
 * - Multiple environment support
 * - Custom styling and branding
 * - Security scheme definitions
 * - Response examples and error codes
 *
 * Usage:
 * 1. Add JSDoc comments with @swagger tags to your routes
 * 2. Define schemas in the components section
 * 3. Access documentation at /api-docs endpoint
 *
 * Example Route Documentation:
 * ```
 * /**
 *  * @swagger
 *  * /api/users:
 *  *   get:
 *  *     summary: Get all users
 *  *     tags: [Users]
 *  *     responses:
 *  *       200:
 *  *         description: List of users
 *  *         content:
 *  *           application/json:
 *  *             schema:
 *  *               type: array
 *  *               items:
 *  *                 $ref: '#/components/schemas/User'
 *  * /
 * ```
 */

/**
 * Basic OpenAPI/Swagger configuration object
 */
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Company Data Management API',
        version: '1.0.0',
        description: `
      A comprehensive REST API for managing company data built with Express.js, TypeScript, and MongoDB.
      
      ## Features
      - **Type-safe**: Built with TypeScript for better development experience
      - **Database**: MongoDB with Mongoose ODM for data persistence
      - **Authentication**: JWT-based authentication and authorization
      - **Validation**: Request/response validation with detailed error messages
      - **Error Handling**: Comprehensive error handling with proper HTTP status codes
      - **Documentation**: Auto-generated API documentation with Swagger
      - **Security**: Rate limiting, CORS, helmet, and other security middleware
      
      ## Getting Started
      1. Obtain an API key from the authentication endpoint
      2. Include the token in the Authorization header: \`Bearer <token>\`
      3. Make requests to the available endpoints
      
      ## Rate Limiting
      API requests are rate limited to prevent abuse:
      - **General endpoints**: 100 requests per 15 minutes
      - **Authentication endpoints**: 5 requests per 15 minutes
      
      ## Error Responses
      All error responses follow a consistent format:
      \`\`\`json
      {
        "success": false,
        "statusCode": 400,
        "message": "Error description",
        "errors": ["Detailed error messages"],
        "timestamp": "2023-01-01T00:00:00.000Z",
        "path": "/api/endpoint"
      }
      \`\`\`
    `,
        contact: {
            name: 'API Support',
            email: 'support@company.com',
            url: 'https://company.com/support',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },
    servers: [
        {
            url:
                process.env.NODE_ENV === 'production'
                    ? 'https://api.company.com'
                    : `http://localhost:${process.env.PORT || 3000}`,
            description:
                process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT token in the format: Bearer <token>',
            },
            apiKey: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API key for authentication',
            },
        },
        schemas: {
            // Standard API Response Schema
            ApiResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        description: 'Indicates if the request was successful',
                    },
                    statusCode: {
                        type: 'integer',
                        description: 'HTTP status code',
                    },
                    message: {
                        type: 'string',
                        description: 'Response message',
                    },
                    data: {
                        type: 'object',
                        description: 'Response data (varies by endpoint)',
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Response timestamp in ISO format',
                    },
                    path: {
                        type: 'string',
                        description: 'Request path',
                    },
                },
                required: ['success', 'statusCode', 'message', 'timestamp'],
            },
            // Error Response Schema
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false,
                    },
                    statusCode: {
                        type: 'integer',
                        description: 'HTTP error status code',
                    },
                    message: {
                        type: 'string',
                        description: 'Error message',
                    },
                    errors: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                        description: 'Array of detailed error messages',
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                    },
                    path: {
                        type: 'string',
                        description: 'Request path that caused the error',
                    },
                },
                required: ['success', 'statusCode', 'message', 'timestamp'],
            },
            // Pagination Schema
            Pagination: {
                type: 'object',
                properties: {
                    page: {
                        type: 'integer',
                        minimum: 1,
                        description: 'Current page number',
                    },
                    limit: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        description: 'Number of items per page',
                    },
                    total: {
                        type: 'integer',
                        description: 'Total number of items',
                    },
                    pages: {
                        type: 'integer',
                        description: 'Total number of pages',
                    },
                    hasNext: {
                        type: 'boolean',
                        description: 'Whether there is a next page',
                    },
                    hasPrev: {
                        type: 'boolean',
                        description: 'Whether there is a previous page',
                    },
                },
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
    tags: [
        {
            name: 'Health',
            description: 'Health check and system status endpoints',
        },
        {
            name: 'Authentication',
            description: 'User authentication and authorization endpoints',
        },
        {
            name: 'Users',
            description: 'User management operations',
        },
        {
            name: 'Company',
            description: 'Company data management operations',
        },
    ],
};

/**
 * Swagger JSDoc options configuration
 */
const swaggerOptions: swaggerJSDoc.Options = {
    definition: swaggerDefinition,
    apis: [
        './src/routes/*.ts', // Route files
        './src/controllers/*.ts', // Controller files
        './src/models/*.ts', // Model files
        './src/middleware/*.ts', // Middleware files
    ],
};

/**
 * Generate Swagger specification
 */
const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Swagger UI options for customization
 */
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .info .description { color: #34495e; }
    .swagger-ui .scheme-container { background: #ecf0f1; }
  `,
    customSiteTitle: 'Company Data Management API',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        syntaxHighlight: {
            activate: true,
            theme: 'tomorrow-night',
        },
    },
};

/**
 * Setup Swagger documentation middleware
 * @param app - Express application instance
 * @param path - Path where documentation will be served (default: '/api-docs')
 */
const setupSwagger = (app: Express, path: string = '/api-docs'): void => {
    // Serve swagger specification as JSON
    app.get(`${path}.json`, (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // Serve swagger UI
    app.use(path, swaggerUi.serve);
    app.get(path, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    console.log(
        `📚 Swagger documentation available at: http://localhost:${process.env.PORT || 3000}${path}`
    );
};

/**
 * Get swagger specification object
 * Useful for testing or external integrations
 */
const getSwaggerSpec = () => swaggerSpec;

/**
 * Validate swagger specification
 * Useful for CI/CD pipelines to ensure documentation is valid
 */
const validateSwaggerSpec = (): boolean => {
    try {
        const spec = swaggerJSDoc(swaggerOptions);
        return !!spec && typeof spec === 'object' && (spec as any).openapi === '3.0.0';
    } catch (error) {
        console.error('❌ Swagger specification validation failed:', error);
        return false;
    }
};

export {
    setupSwagger,
    getSwaggerSpec,
    validateSwaggerSpec,
    swaggerSpec,
    swaggerOptions,
    swaggerUiOptions,
};

export default setupSwagger;
