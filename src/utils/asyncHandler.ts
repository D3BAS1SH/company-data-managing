import { Request, Response, NextFunction } from 'express';

/**
 * Async Handler Utility
 *
 * This module provides a higher-order function to handle asynchronous operations
 * in Express.js route handlers and middleware. It automatically catches any
 * errors thrown in async functions and passes them to Express error handling
 * middleware, eliminating the need for try-catch blocks in every async route.
 *
 * Features:
 * - Automatic error catching for async functions
 * - Clean and readable route handlers
 * - Consistent error handling across the application
 * - Type-safe with TypeScript support
 * - Compatible with Express.js middleware pattern
 *
 * Usage Examples:
 *
 * 1. Route Handler:
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(new ApiResponse(200, "Users fetched successfully", users));
 * }));
 *
 * 2. Middleware:
 * const authMiddleware = asyncHandler(async (req, res, next) => {
 *   const token = req.headers.authorization;
 *   const user = await verifyToken(token);
 *   req.user = user;
 *   next();
 * });
 *
 * 3. Controller Methods:
 * class UserController {
 *   createUser = asyncHandler(async (req: Request, res: Response) => {
 *     const user = await User.create(req.body);
 *     res.status(201).json(new ApiResponse(201, "User created", user));
 *   });
 * }
 */

/**
 * Type definition for async request handler
 */
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Type definition for async middleware
 */
type AsyncMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Type definition for async error handler
 */
type AsyncErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>;

/**
 * Higher-order function that wraps async route handlers and middleware
 * to automatically catch and forward errors to Express error handling middleware.
 *
 * @param fn - The async function to wrap (route handler or middleware)
 * @returns Express middleware function with error handling
 *
 * @example
 * // Basic usage with route handler
 * app.get('/api/users/:id', asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) {
 *     throw new ApiError(404, "User not found");
 *   }
 *   res.json(new ApiResponse(200, "User found", user));
 * }));
 *
 * @example
 * // Usage with middleware
 * const validateUser = asyncHandler(async (req, res, next) => {
 *   const { error } = userSchema.validate(req.body);
 *   if (error) {
 *     throw new ApiError(400, "Validation failed", error.details);
 *   }
 *   next();
 * });
 */
const asyncHandler = (fn: AsyncRequestHandler | AsyncMiddleware) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Execute the async function and catch any errors
        Promise.resolve(fn(req, res, next)).catch((error: Error) => {
            // Pass the error to Express error handling middleware
            next(error);
        });
    };
};

/**
 * Higher-order function specifically for async error handlers
 * Used when creating custom error handling middleware that performs async operations
 *
 * @param fn - The async error handler function
 * @returns Express error handling middleware with error catching
 *
 * @example
 * const logErrorToDatabase = asyncErrorHandler(async (err, req, res, next) => {
 *   await ErrorLog.create({
 *     message: err.message,
 *     stack: err.stack,
 *     url: req.url,
 *     method: req.method,
 *     timestamp: new Date()
 *   });
 *   next(err);
 * });
 */
const asyncErrorHandler = (fn: AsyncErrorHandler) => {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(err, req, res, next)).catch((error: Error) => {
            // If error occurs in error handler, pass original error
            next(error);
        });
    };
};

/**
 * Utility function to create async controller methods
 * Useful for class-based controllers where methods need error handling
 *
 * @param target - The target object (controller instance)
 * @param propertyName - The name of the method
 * @param descriptor - Property descriptor
 *
 * @example
 * class UserController {
 *   @AsyncMethod
 *   async createUser(req: Request, res: Response) {
 *     const user = await User.create(req.body);
 *     res.json(new ApiResponse(201, "User created", user));
 *   }
 * }
 */
const AsyncMethod = (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
        const [req, res, next] = args;
        return Promise.resolve(method.apply(this, args)).catch(next);
    };

    return descriptor;
};

/**
 * Utility function to wrap multiple async functions
 * Useful for creating arrays of middleware with error handling
 *
 * @param functions - Array of async functions to wrap
 * @returns Array of wrapped functions with error handling
 *
 * @example
 * const middleware = wrapAsync([
 *   authenticate,
 *   authorize,
 *   validateInput
 * ]);
 * app.post('/api/users', ...middleware, createUser);
 */
const wrapAsync = (
    functions: AsyncRequestHandler[]
): Array<(req: Request, res: Response, next: NextFunction) => void> => {
    return functions.map(fn => asyncHandler(fn));
};

/**
 * Type guard to check if a function is async
 * Utility function for runtime type checking
 *
 * @param fn - Function to check
 * @returns Boolean indicating if function is async
 */
const isAsyncFunction = (fn: Function): boolean => {
    return fn.constructor.name === 'AsyncFunction';
};

export {
    asyncHandler,
    asyncErrorHandler,
    AsyncMethod,
    wrapAsync,
    isAsyncFunction,
    AsyncRequestHandler,
    AsyncMiddleware,
    AsyncErrorHandler,
};

// Default export for convenience
export default asyncHandler;
