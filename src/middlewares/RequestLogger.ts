import { Request, Response, NextFunction } from "express";
import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";
import { Service } from "typedi";
import { ENV } from "../config/env";

@Service()
@Middleware({ type: "before" })
export class RequestLoggerMiddleware implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction): void {
    if (
      ENV.NODE_ENV === "production" &&
      (req.path.includes("health") ||
        req.path.includes("favicon") ||
        req.path.startsWith("/static"))
    ) {
      return next();
    }

    const start = Date.now();
    const { method, originalUrl, ip } = req;

    console.log(`📥 ${method} ${originalUrl} from ${ip}`);

    res.on("finish", () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      let statusSymbol = "✅";
      if (statusCode >= 400) statusSymbol = "⚠️";
      if (statusCode >= 500) statusSymbol = "❌";

      console.log(
        `📤 ${statusSymbol} ${method} ${originalUrl} ${statusCode} - ${duration}ms`
      );
    });

    next();
  }
}
