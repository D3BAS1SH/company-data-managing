import { Router, Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * Health Routes
 *
 * These routes provide health check and system status endpoints
 * for monitoring and load balancing purposes.
 */

const router = Router();

/**
 * @swagger
 * /health/status:
 *   get:
 *     summary: Get detailed system status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System status information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get(
    '/status',
    asyncHandler(async (req: Request, res: Response) => {
        const status = {
            server: 'operational',
            database: 'connected', // This would check actual DB status
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        };

        res.status(200).json(new ApiResponse(200, 'System status retrieved', status));
    })
);

/**
 * @swagger
 * /health/ping:
 *   get:
 *     summary: Simple ping endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Pong response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get(
    '/ping',
    asyncHandler(async (req: Request, res: Response) => {
        res.status(200).json(new ApiResponse(200, 'pong', { timestamp: new Date().toISOString() }));
    })
);

export default router;
