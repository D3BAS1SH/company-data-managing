import mongoose, { ConnectOptions } from 'mongoose';

/**
 * MongoDB Database Configuration
 *
 * This module handles the MongoDB connection using Mongoose ODM.
 * It provides a robust connection setup with proper error handling,
 * connection events, and configuration options.
 *
 * Features:
 * - Automatic reconnection on connection loss
 * - Connection pooling for better performance
 * - Proper error handling and logging
 * - Connection state monitoring
 * - Graceful shutdown handling
 */

interface DatabaseConfig {
    uri: string;
    options: ConnectOptions;
}

class Database {
    private static instance: Database;
    private isConnected: boolean = false;

    private constructor() {}

    /**
     * Singleton pattern to ensure only one database connection instance
     */
    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * Establishes connection to MongoDB database
     * @param config - Database configuration object
     * @returns Promise<void>
     */
    public async connect(config?: DatabaseConfig): Promise<void> {
        if (this.isConnected) {
            console.log('📦 Database already connected');
            return;
        }

        try {
            const mongoUri =
                config?.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/company-data';

            const defaultOptions: ConnectOptions = {
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds
                bufferCommands: false, // Disable mongoose buffering
            };

            const options = { ...defaultOptions, ...config?.options };

            // Connect to MongoDB
            await mongoose.connect(mongoUri, options);

            this.isConnected = true;
            console.log('🚀 Connected to MongoDB successfully');

            // Connection event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
        }
    }

    /**
     * Sets up event listeners for MongoDB connection
     */
    private setupEventListeners(): void {
        // Connection events
        mongoose.connection.on('connected', () => {
            console.log('📦 Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', err => {
            console.error('❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('📦 Mongoose disconnected from MongoDB');
            this.isConnected = false;
        });

        // Application termination handlers
        process.on('SIGINT', this.gracefulShutdown.bind(this));
        process.on('SIGTERM', this.gracefulShutdown.bind(this));
    }

    /**
     * Gracefully closes the database connection
     */
    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('📦 Database connection closed successfully');
        } catch (error) {
            console.error('❌ Error closing database connection:', error);
        }
    }

    /**
     * Handles graceful shutdown of the application
     */
    private async gracefulShutdown(signal: string): Promise<void> {
        console.log(`\n📦 Received ${signal}. Gracefully shutting down...`);
        await this.disconnect();
        process.exit(0);
    }

    /**
     * Gets the current connection status
     */
    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * Gets the MongoDB connection instance
     */
    public getConnection(): mongoose.Connection {
        return mongoose.connection;
    }
}

// Export singleton instance
export const database = Database.getInstance();

// Export the class for testing purposes
export { Database };

// Default export for convenience
export default database;
