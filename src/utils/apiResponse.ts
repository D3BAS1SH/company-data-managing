/**
 * API Response Utilities
 *
 * This module provides standardized response classes for API endpoints.
 * It ensures consistent response structure across the application and
 * proper error handling with appropriate HTTP status codes.
 *
 * Features:
 * - Standardized success response format
 * - Comprehensive error handling with status codes
 * - Type-safe response structures
 * - Easy integration with Express.js
 * - Consistent error messaging
 */

/**
 * Standard API Response Interface
 */
interface IApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    errors?: string[];
    timestamp: string;
    path?: string;
}

/**
 * ApiResponse Class
 *
 * Handles successful API responses with a consistent structure.
 * Used to return data and success messages to the client.
 *
 * @example
 * const response = new ApiResponse(200, "User created successfully", { id: 1, name: "John" });
 * res.status(response.statusCode).json(response);
 */
class ApiResponse<T = any> implements IApiResponse<T> {
    public success: boolean;
    public statusCode: number;
    public message: string;
    public data?: T;
    public timestamp: string;
    public path?: string;

    constructor(statusCode: number, message: string = 'Success', data?: T, path?: string) {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.timestamp = new Date().toISOString();
        this.path = path;
    }

    /**
     * Convert response to JSON format
     */
    public toJSON(): IApiResponse<T> {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
            timestamp: this.timestamp,
            path: this.path,
        };
    }

    /**
     * Static method to create a success response
     */
    static success<T>(
        data?: T,
        message: string = 'Operation successful',
        statusCode: number = 200
    ): ApiResponse<T> {
        return new ApiResponse(statusCode, message, data);
    }

    /**
     * Static method to create a created response
     */
    static created<T>(data?: T, message: string = 'Resource created successfully'): ApiResponse<T> {
        return new ApiResponse(201, message, data);
    }

    /**
     * Static method to create a no content response
     */
    static noContent(message: string = 'No content'): ApiResponse<null> {
        return new ApiResponse(204, message, null);
    }
}

/**
 * ApiError Class
 *
 * Handles error responses with proper HTTP status codes and error details.
 * Extends the native Error class to provide additional context for API errors.
 *
 * @example
 * throw new ApiError(404, "User not found", ["User with ID 123 does not exist"]);
 */
class ApiError extends Error implements IApiResponse {
    public success: boolean = false;
    public statusCode: number;
    public message: string;
    public errors?: string[];
    public timestamp: string;
    public path?: string;
    public stack?: string;
    public isOperational: boolean;

    constructor(
        statusCode: number,
        message: string = 'Something went wrong',
        errors?: string[],
        path?: string,
        isOperational: boolean = true,
        stack?: string
    ) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.timestamp = new Date().toISOString();
        this.path = path;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Convert error to JSON format
     */
    public toJSON(): IApiResponse {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            errors: this.errors,
            timestamp: this.timestamp,
            path: this.path,
        };
    }

    /**
     * Static method to create a bad request error (400)
     */
    static badRequest(message: string = 'Bad request', errors?: string[]): ApiError {
        return new ApiError(400, message, errors);
    }

    /**
     * Static method to create an unauthorized error (401)
     */
    static unauthorized(message: string = 'Unauthorized access'): ApiError {
        return new ApiError(401, message);
    }

    /**
     * Static method to create a forbidden error (403)
     */
    static forbidden(message: string = 'Forbidden access'): ApiError {
        return new ApiError(403, message);
    }

    /**
     * Static method to create a not found error (404)
     */
    static notFound(message: string = 'Resource not found'): ApiError {
        return new ApiError(404, message);
    }

    /**
     * Static method to create a method not allowed error (405)
     */
    static methodNotAllowed(message: string = 'Method not allowed'): ApiError {
        return new ApiError(405, message);
    }

    /**
     * Static method to create a conflict error (409)
     */
    static conflict(message: string = 'Resource conflict'): ApiError {
        return new ApiError(409, message);
    }

    /**
     * Static method to create an unprocessable entity error (422)
     */
    static unprocessableEntity(
        message: string = 'Unprocessable entity',
        errors?: string[]
    ): ApiError {
        return new ApiError(422, message, errors);
    }

    /**
     * Static method to create a too many requests error (429)
     */
    static tooManyRequests(message: string = 'Too many requests'): ApiError {
        return new ApiError(429, message);
    }

    /**
     * Static method to create an internal server error (500)
     */
    static internal(message: string = 'Internal server error', errors?: string[]): ApiError {
        return new ApiError(500, message, errors);
    }

    /**
     * Static method to create a not implemented error (501)
     */
    static notImplemented(message: string = 'Not implemented'): ApiError {
        return new ApiError(501, message);
    }

    /**
     * Static method to create a service unavailable error (503)
     */
    static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
        return new ApiError(503, message);
    }

    /**
     * Static method to create a gateway timeout error (504)
     */
    static gatewayTimeout(message: string = 'Gateway timeout'): ApiError {
        return new ApiError(504, message);
    }
}

export { ApiResponse, ApiError, IApiResponse };
