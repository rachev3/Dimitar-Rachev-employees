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
import { CsvValidationService } from "../services/CsvValidationService";
import {
  InputValidationError,
  ParsingError,
  DataValidationError,
} from "../utils/errors";
import { successResponse, messageResponse } from "../utils/responseFormatter";

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
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
  constructor(
    private collaborationService: CollaborationService,
    private csvValidationService: CsvValidationService
  ) {}

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
      const lines = fileContent.split("\n");

      const records = this.csvValidationService.validateCsvFormat(lines);

      const longestCollaborations =
        this.collaborationService.findLongestCollaboration(records);

      if (longestCollaborations.length === 0) {
        return messageResponse(
          "No overlapping work periods found between any pair of employees."
        );
      }

      const result = longestCollaborations.map((collab) => [
        collab.employee1Id,
        collab.employee2Id,
        collab.totalDays,
      ]);

      return successResponse(result);
    } catch (error: unknown) {
      if (
        error instanceof InputValidationError ||
        error instanceof ParsingError ||
        error instanceof DataValidationError
      ) {
        throw error;
      }

      throw new InputValidationError(
        error instanceof Error ? error.message : "Failed to process CSV file"
      );
    }
  }
}
