/**
 * SERVER ENTRY POINT AND CONFIGURATION
 *
 * This is the main server file that starts the Express.js application,
 * connects to the database, and handles server lifecycle management.
 *
 * ==============================================================================
 * SERVER STARTUP SEQUENCE
 * ==============================================================================
 *
 * The server follows this startup sequence for reliability and proper error handling:
 *
 * 1. **Environment Validation**: Check required environment variables
 * 2. **Database Connection**: Connect to MongoDB before starting server
 * 3. **Server Start**: Start Express server on specified port
 * 4. **Health Monitoring**: Set up health checks and monitoring
 * 5. **Graceful Shutdown**: Handle shutdown signals properly
 *
 * ==============================================================================
 * ENVIRONMENT VARIABLES
 * ==============================================================================
 *
 * Required environment variables for server operation:
 *
 * ```env
 * # Server Configuration
 * PORT=3000                    # Port number for the server
 * NODE_ENV=development         # Environment (development/production/test)
 *
 * # Database Configuration
 * MONGODB_URI=mongodb://localhost:27017/company-data
 *
 * # Security Configuration
 * JWT_SECRET=your-secret-key   # Secret for JWT token signing
 * JWT_EXPIRE=7d               # JWT token expiration time
 *
 * # Optional Configuration
 * API_PREFIX=/api/v1          # API route prefix
 * SWAGGER_ENABLED=true        # Enable/disable Swagger documentation
 * RATE_LIMIT_WINDOW_MS=900000 # Rate limiting window (15 minutes)
 * RATE_LIMIT_MAX_REQUESTS=100 # Max requests per window
 * ```
 *
 * ==============================================================================
 * SERVER LIFECYCLE MANAGEMENT
 * ==============================================================================
 *
 * 1. **Startup**:
 *    - Validate environment variables
 *    - Initialize database connection
 *    - Start HTTP server
 *    - Log server information
 *
 * 2. **Runtime**:
 *    - Handle incoming requests
 *    - Monitor server health
 *    - Log errors and important events
 *    - Maintain database connections
 *
 * 3. **Shutdown**:
 *    - Receive shutdown signals (SIGTERM, SIGINT)
 *    - Stop accepting new requests
 *    - Complete pending requests
 *    - Close database connections
 *    - Exit process gracefully
 *
 * ==============================================================================
 * ERROR HANDLING STRATEGY
 * ==============================================================================
 *
 * 1. **Database Connection Errors**:
 *    - Retry connection with exponential backoff
 *    - Log connection attempts and failures
 *    - Exit process if unable to connect after retries
 *
 * 2. **Server Startup Errors**:
 *    - Check if port is already in use
 *    - Log detailed error information
 *    - Exit process with appropriate error code
 *
 * 3. **Runtime Errors**:
 *    - Log unhandled exceptions and rejections
 *    - Attempt graceful recovery when possible
 *    - Exit process for critical errors
 *
 * ==============================================================================
 * MONITORING AND HEALTH CHECKS
 * ==============================================================================
 *
 * 1. **Server Health**:
 *    - HTTP health check endpoint at /health
 *    - Monitor server uptime and memory usage
 *    - Check database connection status
 *
 * 2. **Performance Monitoring**:
 *    - Request/response time tracking
 *    - Memory usage monitoring
 *    - CPU usage monitoring
 *    - Error rate tracking
 *
 * 3. **Logging**:
 *    - Structured logging with timestamps
 *    - Request/response logging
 *    - Error logging with stack traces
 *    - Application event logging
 *
 * ==============================================================================
 * DEPLOYMENT CONSIDERATIONS
 * ==============================================================================
 *
 * 1. **Process Management**:
 *    - Use PM2 or similar for production
 *    - Configure cluster mode for scaling
 *    - Set up automatic restarts
 *
 * 2. **Load Balancing**:
 *    - Configure reverse proxy (nginx, ALB)
 *    - Set up health checks for load balancer
 *    - Enable sticky sessions if needed
 *
 * 3. **Security**:
 *    - Run server as non-root user
 *    - Use HTTPS in production
 *    - Configure firewall rules
 *    - Set up security monitoring
 *
 * 4. **Scaling**:
 *    - Horizontal scaling with load balancers
 *    - Database read replicas
 *    - Caching layers (Redis)
 *    - CDN for static assets
 *
 * ==============================================================================
 * DOCKER CONFIGURATION
 * ==============================================================================
 *
 * Example Dockerfile for containerization:
 *
 * ```dockerfile
 * FROM node:18-alpine
 *
 * WORKDIR /app
 *
 * COPY package*.json ./
 * RUN npm ci --only=production
 *
 * COPY dist ./dist
 *
 * USER node
 *
 * EXPOSE 3000
 *
 * CMD ["node", "dist/server.js"]
 * ```
 *
 * Example docker-compose.yml:
 *
 * ```yaml
 * version: '3.8'
 * services:
 *   app:
 *     build: .
 *     ports:
 *       - "3000:3000"
 *     environment:
 *       - NODE_ENV=production
 *       - MONGODB_URI=mongodb://mongo:27017/company-data
 *     depends_on:
 *       - mongo
 *
 *   mongo:
 *     image: mongo:5
 *     volumes:
 *       - mongo-data:/data/db
 *
 * volumes:
 *   mongo-data:
 * ```
 *
 * Follow these patterns for reliable server deployment and operation!
 */

import { Server } from 'http';
import app from './app';
import { database } from './configs/db';

/**
 * Server Configuration
 *
 * Extract server configuration from environment variables
 * with sensible defaults for development.
 */
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Validate Environment Variables
 *
 * Check that all required environment variables are present
 * before starting the server.
 */
const validateEnvironment = (): void => {
    const requiredEnvVars = ['MONGODB_URI'];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.error('\nPlease set these variables in your .env file or environment.');
        process.exit(1);
    }

    console.log('✅ Environment variables validated');
};

/**
 * Database Connection with Retry Logic
 *
 * Attempt to connect to MongoDB with retry logic for resilience.
 * This is especially important in containerized environments where
 * the database might not be immediately available.
 */
const connectToDatabase = async (retries = 5, delay = 5000): Promise<void> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 Attempting database connection (${attempt}/${retries})...`);
            await database.connect();
            console.log('✅ Database connected successfully');
            return;
        } catch (error) {
            console.error(`❌ Database connection attempt ${attempt} failed:`, error);

            if (attempt === retries) {
                console.error('💥 Failed to connect to database after all retries');
                process.exit(1);
            }

            console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5; // Exponential backoff
        }
    }
};

/**
 * Start HTTP Server
 *
 * Start the Express server and handle any startup errors.
 */
const startServer = (): Promise<Server> => {
    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, HOST, () => {
            console.log('\n🚀 Server started successfully!');
            console.log('┌─────────────────────────────────────────┐');
            console.log('│             SERVER INFORMATION          │');
            console.log('├─────────────────────────────────────────┤');
            console.log(`│ Environment: ${NODE_ENV.padEnd(23)} │`);
            console.log(`│ Host:        ${HOST.padEnd(23)} │`);
            console.log(`│ Port:        ${PORT.toString().padEnd(23)} │`);
            console.log(`│ URL:         http://${HOST}:${PORT.toString().padEnd(15)} │`);
            console.log(`│ API:         http://${HOST}:${PORT}/api/v1${' '.repeat(8)} │`);
            console.log(`│ Docs:        http://${HOST}:${PORT}/api-docs${' '.repeat(6)} │`);
            console.log(`│ Health:      http://${HOST}:${PORT}/health${' '.repeat(8)} │`);
            console.log('└─────────────────────────────────────────┘\n');
            resolve(server);
        });

        server.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
                console.error('Please use a different port or stop the process using this port');
            } else if (error.code === 'EACCES') {
                console.error(`❌ Permission denied to bind to port ${PORT}`);
                console.error('Please use a port number >= 1024 or run with elevated privileges');
            } else {
                console.error('❌ Server startup error:', error);
            }
            reject(error);
        });
    });
};

/**
 * Setup Graceful Shutdown
 *
 * Handle shutdown signals gracefully by closing connections
 * and cleaning up resources.
 */
const setupGracefulShutdown = (server: Server): void => {
    const gracefulShutdown = async (signal: string): Promise<void> => {
        console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

        // Stop accepting new connections
        server.close(async err => {
            if (err) {
                console.error('❌ Error during server shutdown:', err);
                process.exit(1);
            }

            console.log('✅ HTTP server closed');

            try {
                // Close database connection
                await database.disconnect();
                console.log('✅ Database connection closed');

                console.log('✅ Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during graceful shutdown:', error);
                process.exit(1);
            }
        });

        // Force close after timeout
        setTimeout(() => {
            console.error('❌ Graceful shutdown timeout. Forcing exit...');
            process.exit(1);
        }, 10000); // 10 second timeout
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

/**
 * Setup Global Error Handlers
 *
 * Handle uncaught exceptions and unhandled promise rejections
 * to prevent the application from crashing unexpectedly.
 */
const setupGlobalErrorHandlers = (): void => {
    process.on('uncaughtException', (error: Error) => {
        console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);

        // Log to external service (e.g., Sentry, CloudWatch)
        // await logErrorToService(error);

        process.exit(1);
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        console.error('💥 UNHANDLED PROMISE REJECTION! Shutting down...');
        console.error('Reason:', reason);
        console.error('Promise:', promise);

        // Log to external service
        // await logErrorToService(new Error(`Unhandled Rejection: ${reason}`));

        process.exit(1);
    });
};

/**
 * Main Server Initialization Function
 *
 * Orchestrates the complete server startup process including
 * environment validation, database connection, and server startup.
 */
const initializeServer = async (): Promise<void> => {
    try {
        console.log('🚀 Initializing Company Data Management Server...\n');

        // Step 1: Validate environment variables
        validateEnvironment();

        // Step 2: Setup global error handlers
        setupGlobalErrorHandlers();

        // Step 3: Connect to database
        await connectToDatabase();

        // Step 4: Start HTTP server
        const server = await startServer();

        // Step 5: Setup graceful shutdown
        setupGracefulShutdown(server);

        console.log('✅ Server initialization completed successfully!');
        console.log('🎯 Ready to handle requests...\n');
    } catch (error) {
        console.error('💥 Failed to initialize server:', error);
        process.exit(1);
    }
};

/**
 * Health Check Function
 *
 * Perform internal health checks to ensure all systems are operational.
 * This can be called by monitoring services or load balancers.
 */
const performHealthCheck = (): boolean => {
    try {
        // Check database connection
        const dbStatus = database.getConnectionStatus();

        // Check memory usage (warn if > 80%)
        const memUsage = process.memoryUsage();
        const memUsedMB = memUsage.heapUsed / 1024 / 1024;
        const memTotalMB = memUsage.heapTotal / 1024 / 1024;
        const memPercentage = (memUsedMB / memTotalMB) * 100;

        if (memPercentage > 80) {
            console.warn(`⚠️ High memory usage: ${memPercentage.toFixed(2)}%`);
        }

        return dbStatus;
    } catch (error) {
        console.error('❌ Health check failed:', error);
        return false;
    }
};

/**
 * Development Mode Helpers
 *
 * Additional utilities and logging for development environment.
 */
if (NODE_ENV === 'development') {
    console.log('🔧 Development mode enabled');

    // Log memory usage every 30 seconds in development
    setInterval(() => {
        const memUsage = process.memoryUsage();
        console.log(`📊 Memory usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    }, 30000);
}

/**
 * Start the Server
 *
 * Call the initialization function when this file is executed directly.
 */
if (require.main === module) {
    initializeServer().catch(error => {
        console.error('💥 Fatal error during server initialization:', error);
        process.exit(1);
    });
}

// Export for testing and external use
export { app, initializeServer, performHealthCheck };
export default initializeServer;
