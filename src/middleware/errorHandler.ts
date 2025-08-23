import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiResponse';
import { Error as MongooseError } from 'mongoose';

/**
 * Error Handling Middleware
 *
 * This module provides comprehensive error handling for the Express.js application.
 * It catches and processes different types of errors including:
 * - Custom API errors
 * - Mongoose validation errors
 * - MongoDB errors (duplicate key, cast errors, etc.)
 * - JWT errors
 * - Validation errors
 * - General server errors
 *
 * Features:
 * - Centralized error handling
 * - Environment-specific error details (dev vs production)
 * - Proper HTTP status codes
 * - Consistent error response format
 * - Error logging for debugging
 * - Security-conscious error messages in production
 */

/**
 * Interface for extended Error with additional properties
 */
interface ExtendedError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    code?: number;
    path?: string;
    value?: any;
    keyValue?: Record<string, any>;
    errors?: Record<string, any>;
}

/**
 * Development Error Response
 * Sends detailed error information for debugging
 */
const sendErrorDev = (err: ExtendedError, req: Request, res: Response): void => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message,
        error: err,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Production Error Response
 * Sends sanitized error information for security
 */
const sendErrorProd = (err: ExtendedError, req: Request, res: Response): void => {
    const statusCode = err.statusCode || 500;

    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(statusCode).json({
            success: false,
            statusCode,
            message: err.message,
            timestamp: new Date().toISOString(),
            path: req.path,
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥:', err);

        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Something went wrong on our end. Please try again later.',
            timestamp: new Date().toISOString(),
            path: req.path,
        });
    }
};

/**
 * Handle MongoDB Cast Error (Invalid ObjectId)
 */
const handleCastErrorDB = (err: any): ApiError => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return ApiError.badRequest(message);
};

/**
 * Handle MongoDB Duplicate Field Error
 */
const handleDuplicateFieldsDB = (err: any): ApiError => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} = '${value}'. Please use another value.`;
    return ApiError.conflict(message);
};

/**
 * Handle Mongoose Validation Error
 */
const handleValidationErrorDB = (err: MongooseError.ValidationError): ApiError => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = 'Invalid input data';
    return ApiError.unprocessableEntity(message, errors);
};

/**
 * Handle JWT Error
 */
const handleJWTError = (): ApiError => {
    return ApiError.unauthorized('Invalid token. Please log in again.');
};

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = (): ApiError => {
    return ApiError.unauthorized('Your token has expired. Please log in again.');
};

/**
 * Handle Mongoose Connection Error
 */
const handleMongooseConnectionError = (err: any): ApiError => {
    console.error('Database connection error:', err);
    return ApiError.serviceUnavailable('Database connection failed. Please try again later.');
};

/**
 * Handle Mongoose Timeout Error
 */
const handleMongooseTimeoutError = (): ApiError => {
    return ApiError.gatewayTimeout('Database operation timed out. Please try again.');
};

/**
 * Handle File Upload Errors
 */
const handleMulterError = (err: any): ApiError => {
    switch (err.code) {
        case 'LIMIT_FILE_SIZE':
            return ApiError.badRequest('File too large. Maximum size allowed is 5MB.');
        case 'LIMIT_FILE_COUNT':
            return ApiError.badRequest('Too many files. Maximum 5 files allowed.');
        case 'LIMIT_UNEXPECTED_FILE':
            return ApiError.badRequest('Unexpected file field.');
        default:
            return ApiError.badRequest('File upload error.');
    }
};

/**
 * Handle Rate Limiting Errors
 */
const handleRateLimitError = (): ApiError => {
    return ApiError.tooManyRequests('Too many requests from this IP. Please try again later.');
};

/**
 * Handle Syntax Errors (Invalid JSON)
 */
const handleSyntaxError = (err: any): ApiError => {
    if (err.type === 'entity.parse.failed') {
        return ApiError.badRequest('Invalid JSON format in request body.');
    }
    return ApiError.badRequest('Syntax error in request.');
};

/**
 * Handle MongoDB Server Selection Error
 */
const handleMongoServerSelectionError = (): ApiError => {
    return ApiError.serviceUnavailable('Unable to connect to database. Please try again later.');
};

/**
 * Handle MongoDB Network Error
 */
const handleMongoNetworkError = (): ApiError => {
    return ApiError.serviceUnavailable('Database network error. Please try again later.');
};

/**
 * 404 Error Handler for undefined routes
 */
const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    const message = `Cannot ${req.method} ${req.originalUrl}`;
    const error = ApiError.notFound(message);
    next(error);
};

/**
 * Global Error Handler Middleware
 * Must be the last middleware in the application
 */
const globalErrorHandler = (
    err: ExtendedError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let error = { ...err };
    error.message = err.message;

    // Log error for monitoring
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString(),
    });

    // Handle different error types
    if (err.name === 'CastError') {
        error = handleCastErrorDB(err);
    }

    if (err.code === 11000) {
        error = handleDuplicateFieldsDB(err);
    }

    if (err.name === 'ValidationError') {
        error = handleValidationErrorDB(err as MongooseError.ValidationError);
    }

    if (err.name === 'JsonWebTokenError') {
        error = handleJWTError();
    }

    if (err.name === 'TokenExpiredError') {
        error = handleJWTExpiredError();
    }

    if (err.name === 'MongooseServerSelectionError') {
        error = handleMongoServerSelectionError();
    }

    if (err.name === 'MongoNetworkError') {
        error = handleMongoNetworkError();
    }

    if (err.name === 'MongooseTimeoutError') {
        error = handleMongooseTimeoutError();
    }

    if (err.name === 'MongoError' && err.message.includes('connection')) {
        error = handleMongooseConnectionError(err);
    }

    if (err.name === 'MulterError') {
        error = handleMulterError(err);
    }

    if (err.name === 'RateLimitError' || err.message.includes('rate limit')) {
        error = handleRateLimitError();
    }

    if (err.name === 'SyntaxError') {
        error = handleSyntaxError(err);
    }

    // Send error response based on environment
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, req, res);
    } else {
        sendErrorProd(error, req, res);
    }
};

/**
 * Async Error Handler Wrapper
 * Catches async errors and passes them to the global error handler
 */
const asyncErrorHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Validation Error Handler
 * Handles request validation errors from middleware like express-validator
 */
const validationErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
    // This would typically be used with express-validator
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   const errorMessages = errors.array().map(error => error.msg);
    //   const error = ApiError.unprocessableEntity('Validation failed', errorMessages);
    //   return next(error);
    // }
    next();
};

/**
 * Request Timeout Handler
 * Handles requests that take too long to process
 */
const timeoutHandler = (timeout: number = 30000) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                const error = ApiError.gatewayTimeout('Request timeout');
                next(error);
            }
        }, timeout);

        // Clear timeout if response is sent
        res.on('finish', () => clearTimeout(timer));
        res.on('close', () => clearTimeout(timer));

        next();
    };
};

/**
 * CORS Error Handler
 * Handles CORS-related errors
 */
const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    if (err.message && err.message.includes('CORS')) {
        const error = ApiError.forbidden('CORS policy violation');
        return next(error);
    }
    next(err);
};

/**
 * Export all error handling middleware
 */
export {
    globalErrorHandler,
    notFoundHandler,
    asyncErrorHandler,
    validationErrorHandler,
    timeoutHandler,
    corsErrorHandler,
    sendErrorDev,
    sendErrorProd,
};

// Default export for main error handler
export default globalErrorHandler;
