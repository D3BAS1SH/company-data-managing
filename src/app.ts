/**
 * EXPRESS.JS APPLICATION SETUP AND CONFIGURATION
 *
 * This is the main application file that sets up and configures the Express.js server
 * with all necessary middleware, routes, error handling, and security features.
 *
 * ==============================================================================
 * APPLICATION ARCHITECTURE OVERVIEW
 * ==============================================================================
 *
 * This Express.js application follows a modular, scalable architecture with:
 *
 * 1. **Layered Architecture**:
 *    - Presentation Layer: Routes and Controllers
 *    - Business Logic Layer: Services and Utils
 *    - Data Access Layer: Models and Database
 *
 * 2. **Middleware Stack**:
 *    - Security middleware (helmet, cors, rate limiting)
 *    - Parsing middleware (JSON, URL-encoded)
 *    - Logging middleware (morgan)
 *    - Custom middleware (authentication, validation)
 *    - Error handling middleware
 *
 * 3. **Error Handling**:
 *    - Global error handler for all unhandled errors
 *    - Custom API error classes with proper HTTP status codes
 *    - Async error handling for database operations
 *    - Development vs Production error responses
 *
 * 4. **Security Features**:
 *    - Helmet for security headers
 *    - CORS configuration
 *    - Rate limiting to prevent abuse
 *    - Input validation and sanitization
 *    - Environment variable validation
 *
 * 5. **Documentation**:
 *    - Swagger/OpenAPI documentation
 *    - Auto-generated API docs from JSDoc comments
 *    - Interactive API testing interface
 *
 * ==============================================================================
 * MIDDLEWARE EXECUTION ORDER
 * ==============================================================================
 *
 * The middleware are applied in this specific order (order matters!):
 *
 * 1. Security Middleware:
 *    - helmet() - Sets security headers
 *    - cors() - Handles cross-origin requests
 *    - rateLimit() - Prevents abuse
 *
 * 2. Utility Middleware:
 *    - compression() - Compresses responses
 *    - morgan() - HTTP request logging
 *
 * 3. Parsing Middleware:
 *    - express.json() - Parses JSON requests
 *    - express.urlencoded() - Parses form data
 *
 * 4. Custom Middleware:
 *    - API routes and handlers
 *    - Authentication middleware (applied per route)
 *    - Validation middleware (applied per route)
 *
 * 5. Error Handling:
 *    - 404 handler for undefined routes
 *    - Global error handler (must be last)
 *
 * ==============================================================================
 * ENVIRONMENT CONFIGURATION
 * ==============================================================================
 *
 * Required Environment Variables:
 *
 * ```env
 * # Application
 * NODE_ENV=development|production
 * PORT=3000
 * API_PREFIX=/api/v1
 *
 * # Database
 * MONGODB_URI=mongodb://localhost:27017/company-data
 *
 * # Authentication
 * JWT_SECRET=your-super-secret-jwt-key
 * JWT_EXPIRE=7d
 *
 * # Security
 * BCRYPT_ROUNDS=12
 *
 * # Rate Limiting
 * RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
 * RATE_LIMIT_MAX_REQUESTS=100
 *
 * # Swagger
 * SWAGGER_ENABLED=true
 * SWAGGER_PATH=/api-docs
 *
 * # Logging
 * LOG_LEVEL=info
 * ```
 *
 * ==============================================================================
 * ROUTE STRUCTURE
 * ==============================================================================
 *
 * All API routes are prefixed with /api/v1 and organized by resource:
 *
 * ```
 * /api/v1/
 * ├── /health          # Health check endpoints
 * ├── /auth            # Authentication endpoints
 * ├── /users           # User management
 * ├── /companies       # Company management
 * ├── /departments     # Department management
 * ├── /employees       # Employee management
 * └── /projects        # Project management
 * ```
 *
 * ==============================================================================
 * ERROR HANDLING STRATEGY
 * ==============================================================================
 *
 * 1. **Operational Errors**: Expected errors that we can recover from
 *    - Validation errors
 *    - Authentication failures
 *    - Resource not found
 *    - Database connection issues
 *
 * 2. **Programming Errors**: Bugs in the code that need fixing
 *    - Syntax errors
 *    - Type errors
 *    - Null pointer exceptions
 *
 * 3. **Error Response Format**:
 *    ```json
 *    {
 *      "success": false,
 *      "statusCode": 400,
 *      "message": "Human-readable error message",
 *      "errors": ["Detailed error messages"],
 *      "timestamp": "2023-08-24T10:30:00.000Z",
 *      "path": "/api/v1/endpoint"
 *    }
 *    ```
 *
 * ==============================================================================
 * PERFORMANCE CONSIDERATIONS
 * ==============================================================================
 *
 * 1. **Response Compression**: Gzip compression for all responses
 * 2. **Database Indexing**: Proper indexes on frequently queried fields
 * 3. **Connection Pooling**: MongoDB connection pooling configuration
 * 4. **Caching**: Redis integration for session and data caching (future)
 * 5. **Rate Limiting**: Prevents server overload from too many requests
 * 6. **Request Size Limiting**: Prevents large payloads from consuming memory
 *
 * ==============================================================================
 * SECURITY MEASURES
 * ==============================================================================
 *
 * 1. **HTTP Security Headers**: Set by Helmet middleware
 * 2. **CORS**: Configured for specific origins in production
 * 3. **Rate Limiting**: Prevents brute force and DDoS attacks
 * 4. **Input Validation**: All inputs validated and sanitized
 * 5. **Authentication**: JWT-based stateless authentication
 * 6. **Authorization**: Role-based access control (RBAC)
 * 7. **Password Security**: Bcrypt hashing with salt rounds
 * 8. **Environment Variables**: Sensitive data in environment variables
 *
 * ==============================================================================
 * MONITORING AND LOGGING
 * ==============================================================================
 *
 * 1. **HTTP Logging**: Morgan middleware for request/response logging
 * 2. **Error Logging**: Comprehensive error logging with context
 * 3. **Health Checks**: Endpoint for monitoring service health
 * 4. **Performance Metrics**: Response time and throughput monitoring
 * 5. **Database Monitoring**: Connection status and query performance
 *
 * Follow these patterns and documentation when extending the application!
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import utilities and configurations
import { ApiResponse, ApiError } from './utils/apiResponse';
import setupSwagger from './utils/swagger';
import asyncHandler from './utils/asyncHandler';

// Import middleware
import {
    globalErrorHandler,
    notFoundHandler,
    timeoutHandler,
    corsErrorHandler,
} from './middleware/errorHandler';

// Load environment variables
dotenv.config();

/**
 * Create Express Application Instance
 *
 * This creates the main Express application with TypeScript support
 * and sets up the foundation for all middleware and routes.
 */
const app: Express = express();

/**
 * Trust Proxy Configuration
 *
 * Enable this when running behind a reverse proxy (nginx, AWS ALB, etc.)
 * This allows Express to correctly identify client IP addresses and protocol.
 */
app.set('trust proxy', process.env.NODE_ENV === 'production');

/**
 * Security Middleware Configuration
 *
 * These middleware handle security headers, CORS, and rate limiting
 * to protect the application from common web vulnerabilities.
 */

// Helmet: Set security headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        crossOriginEmbedderPolicy: false, // Allow Swagger UI to work
    })
);

// CORS: Cross-Origin Resource Sharing
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:9090'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Rate Limiting: Prevent abuse
const rateLimitConfig = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP
    message: {
        success: false,
        statusCode: 429,
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable the X-RateLimit-* headers
});

app.use(rateLimitConfig);

/**
 * Utility Middleware Configuration
 *
 * These middleware handle request/response processing, compression,
 * and logging for better performance and debugging.
 */

// Compression: Gzip compression for responses
app.use(compression());

// Logging: HTTP request logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// Request timeout handling
app.use(timeoutHandler(30000)); // 30 second timeout

/**
 * Body Parsing Middleware
 *
 * Configure Express to parse different types of request bodies
 * with appropriate size limits to prevent memory exhaustion.
 */

// JSON body parsing
app.use(
    express.json({
        limit: '10mb',
        verify: (req: Request, res: Response, buf: Buffer) => {
            // Store raw body for webhook signature verification if needed
            (req as any).rawBody = buf;
        },
    })
);

// URL-encoded body parsing
app.use(
    express.urlencoded({
        extended: true,
        limit: '10mb',
    })
);

/**
 * API Documentation Setup
 *
 * Configure Swagger/OpenAPI documentation for the API.
 * This provides interactive documentation and testing interface.
 */
if (process.env.SWAGGER_ENABLED !== 'false') {
    setupSwagger(app, process.env.SWAGGER_PATH || '/api-docs');
}

/**
 * Health Check Endpoint
 *
 * Provides a simple health check for monitoring and load balancers.
 * Returns application status, version, and basic system information.
 */
app.get(
    '/health',
    asyncHandler(async (req: Request, res: Response) => {
        const healthCheck = {
            uptime: process.uptime(),
            message: 'OK',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            memory: process.memoryUsage(),
            // Add database connection status check here when database is connected
            // database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        };

        res.status(200).json(new ApiResponse(200, 'Service is healthy', healthCheck));
    })
);

/**
 * API Routes Configuration
 *
 * All API routes are prefixed with /api/v1 for versioning.
 * Import and register route modules here.
 *
 * Example route registration:
 * ```typescript
 * import authRoutes from './routes/auth.routes';
 * import userRoutes from './routes/user.routes';
 * import companyRoutes from './routes/company.routes';
 *
 * app.use('/api/v1/auth', authRoutes);
 * app.use('/api/v1/users', userRoutes);
 * app.use('/api/v1/companies', companyRoutes);
 * ```
 */

const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Root API endpoint
app.get(
    API_PREFIX,
    asyncHandler(async (req: Request, res: Response) => {
        const apiInfo = {
            name: 'Company Data Management API',
            version: '1.0.0',
            description: 'REST API for managing company data',
            documentation: `${req.protocol}://${req.get('host')}/api-docs`,
            endpoints: {
                health: '/health',
                auth: `${API_PREFIX}/auth`,
                users: `${API_PREFIX}/users`,
                companies: `${API_PREFIX}/companies`,
                // Add more endpoint documentation here
            },
        };

        res.status(200).json(new ApiResponse(200, 'API is running', apiInfo));
    })
);

// TODO: Import and register route modules here
// Example:
import healthRoutes from './routes/health.routes';
app.use(`${API_PREFIX}/health`, healthRoutes);

import { companyRoutes } from './routes';

// Register company routes
app.use(`${API_PREFIX}/companies`, companyRoutes);

/**
 * Error Handling Middleware
 *
 * These middleware handle errors and 404 responses.
 * They must be registered after all routes and other middleware.
 */

// CORS error handling
app.use(corsErrorHandler);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

/**
 * Graceful Shutdown Handling
 *
 * Handle application shutdown gracefully by cleaning up resources,
 * closing database connections, and finishing pending requests.
 */
const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    // Add cleanup logic here:
    // - Close database connections
    // - Finish pending requests
    // - Clean up temporary files
    // - Cancel ongoing operations

    process.exit(0);
};

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err: Error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error('Error:', err.name, err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (err: any) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error('Error:', err);
    process.exit(1);
});

/**
 * Export Express Application
 *
 * Export the configured Express application for use in server.ts
 * and for testing purposes.
 */
export default app;
