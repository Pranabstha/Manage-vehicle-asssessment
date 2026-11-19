import type { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log(`${req.method} ${req.originalUrl} from client IP: ${clientIp}`);
  next();
}
