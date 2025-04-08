import { Request, Response, NextFunction } from "express";
import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";
import { Service } from "typedi";
import { RateLimitError } from "../utils/errors";

interface RequestRecord {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

@Service()
@Middleware({ type: "before" })
export class RateLimiterMiddleware implements ExpressMiddlewareInterface {
  private requests: Map<string, RequestRecord> = new Map();
  private readonly MAX_REQUESTS = 60;
  private readonly WINDOW_MS = 60 * 1000;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

  constructor() {
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of this.requests.entries()) {
      if (now - record.lastRequest > this.WINDOW_MS) {
        this.requests.delete(ip);
      }
    }
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (!req.path.startsWith("/api/auth")) {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    const record = this.requests.get(ip) || {
      count: 0,
      firstRequest: now,
      lastRequest: now,
    };

    if (now - record.firstRequest > this.WINDOW_MS) {
      record.count = 0;
      record.firstRequest = now;
    }

    record.count += 1;
    record.lastRequest = now;
    this.requests.set(ip, record);

    if (record.count > this.MAX_REQUESTS) {
      throw new RateLimitError();
    }

    next();
  }
}
