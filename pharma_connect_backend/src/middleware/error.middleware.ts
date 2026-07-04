import { NextFunction, Request, Response } from "express";
import { ApiError } from "../common/ApiError";
import { logger } from "../common/logger";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error(err.message, { stack: err.stack, path: req.path });
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, details: err.details ?? null },
    });
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  logger.error(message, { err, path: req.path });
  return res.status(500).json({
    success: false,
    error: { message: "Internal server error" },
  });
}
