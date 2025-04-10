import {
  JsonController,
  Post,
  Req,
  UseBefore,
  Authorized,
  Middleware,
} from "routing-controllers";
import type { Request, Response, NextFunction } from "express";
import { Service } from "typedi";
import multer from "multer";
import { CollaborationService } from "../services/CollaborationService";
import { InputValidationError } from "../utils/errors";

// Set up multer with file size limit (10MB) and file filter
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Check if it's a CSV file
    if (
      file.mimetype !== "text/csv" &&
      !file.originalname.toLowerCase().endsWith(".csv")
    ) {
      cb(
        new InputValidationError("Incorrect file type. A CSV file is required.")
      );
      return;
    }
    cb(null, true);
  },
});

// Custom middleware to handle multer errors
const handleMulterErrors = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(new InputValidationError("File size limit exceeded (max: 10MB)"));
      return;
    }
    next(new InputValidationError(err.message));
    return;
  }
  next(err);
};

@Service()
@JsonController("/collaboration")
export class CollaborationController {
  constructor(private collaborationService: CollaborationService) {}

  @Post("/analyze")
  @Authorized()
  @UseBefore(upload.single("file"))
  @UseBefore(handleMulterErrors)
  async analyzeCollaboration(@Req() request: Request) {
    try {
      if (!request.file) {
        throw new InputValidationError("No file provided");
      }

      const fileContent = request.file.buffer.toString();

      // Check if file is empty
      if (!fileContent.trim()) {
        throw new InputValidationError("The provided file is empty");
      }

      const lines = fileContent.split("\n");

      const records = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [empId, projectId, dateFrom, dateTo] = line
            .split(",")
            .map((item) => item.trim());
          return {
            employeeId: empId,
            projectId: projectId,
            dateFrom: dateFrom,
            dateTo: dateTo === "undefined" ? null : dateTo,
          };
        });

      const longestCollaboration =
        this.collaborationService.findLongestCollaboration(records);

      if (!longestCollaboration) {
        return [];
      }

      return {
        success: true,
        longestCollaboration: {
          employee1Id: longestCollaboration.employee1Id,
          employee2Id: longestCollaboration.employee2Id,
          totalDays: longestCollaboration.totalDays,
        },
      };
    } catch (error: unknown) {
      // Re-throw InputValidationError as is
      if (error instanceof InputValidationError) {
        throw error;
      }

      // For any other errors, throw a generic error
      throw new InputValidationError(
        error instanceof Error ? error.message : "Failed to process CSV file"
      );
    }
  }
}
