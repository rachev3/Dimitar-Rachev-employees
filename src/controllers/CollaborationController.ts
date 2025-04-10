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
import {
  InputValidationError,
  ParsingError,
  DataValidationError,
} from "../utils/errors";

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

interface CsvRecord {
  employeeId: string;
  projectId: string;
  dateFrom: string;
  dateTo: string | null;
}

interface ValidationError {
  rowNumber: number;
  reason: string;
}

@Service()
@JsonController("/collaboration")
export class CollaborationController {
  constructor(private collaborationService: CollaborationService) {}

  private isEmptyOrUndefined(value: string): boolean {
    const trimmed = value.trim().toLowerCase();
    return !trimmed || trimmed === "undefined" || trimmed === "null";
  }

  private isValidId(value: string): boolean {
    return /^\d+$/.test(value.trim());
  }

  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private validateDataTypes(records: CsvRecord[]): ValidationError[] {
    const invalidRows: ValidationError[] = [];

    records.forEach((record, index) => {
      if (!this.isValidId(record.employeeId)) {
        invalidRows.push({
          rowNumber: index + 1,
          reason: "EmpID must be a valid number",
        });
      }

      if (!this.isValidId(record.projectId)) {
        invalidRows.push({
          rowNumber: index + 1,
          reason: "ProjectID must be a valid number",
        });
      }

      if (!this.isValidDate(record.dateFrom)) {
        invalidRows.push({
          rowNumber: index + 1,
          reason: "DateFrom must be a valid date in YYYY-MM-DD format",
        });
      }

      if (record.dateTo !== null && !this.isValidDate(record.dateTo)) {
        invalidRows.push({
          rowNumber: index + 1,
          reason: "DateTo must be a valid date in YYYY-MM-DD format",
        });
      }
    });

    return invalidRows;
  }

  private validateRow(
    line: string,
    rowNumber: number
  ): CsvRecord | ValidationError {
    if (!line.includes(",")) {
      return {
        rowNumber,
        reason: "No comma delimiter found in row",
      };
    }

    const values = line.split(",").map((item) => item.trim());

    if (values.length !== 4) {
      return {
        rowNumber,
        reason: `Expected 4 columns but found ${values.length}`,
      };
    }

    const [empId, projectId, dateFrom, dateTo] = values;

    if (!empId) {
      return {
        rowNumber,
        reason: "Missing EmpID",
      };
    }
    if (!projectId) {
      return {
        rowNumber,
        reason: "Missing ProjectID",
      };
    }
    if (!dateFrom) {
      return {
        rowNumber,
        reason: "Missing DateFrom",
      };
    }

    if (!this.isValidId(empId)) {
      return {
        rowNumber,
        reason: "EmpID must be a valid number",
      };
    }
    if (!this.isValidId(projectId)) {
      return {
        rowNumber,
        reason: "ProjectID must be a valid number",
      };
    }

    if (!this.isValidDate(dateFrom)) {
      return {
        rowNumber,
        reason: "DateFrom must be a valid date in YYYY-MM-DD format",
      };
    }

    if (
      dateTo &&
      !this.isEmptyOrUndefined(dateTo) &&
      !this.isValidDate(dateTo)
    ) {
      return {
        rowNumber,
        reason: "DateTo must be a valid date in YYYY-MM-DD format",
      };
    }

    return {
      employeeId: empId,
      projectId: projectId,
      dateFrom: dateFrom,
      dateTo: this.isEmptyOrUndefined(dateTo) ? null : dateTo,
    };
  }

  private validateCsvFormat(lines: string[]): CsvRecord[] {
    const nonEmptyLines = lines.filter((line) => line.trim());

    if (nonEmptyLines.length === 0) {
      throw new InputValidationError(
        "The provided file is empty or contains only blank lines"
      );
    }

    const invalidRows: ValidationError[] = [];
    const validRecords: CsvRecord[] = [];

    for (let i = 0; i < nonEmptyLines.length; i++) {
      const result = this.validateRow(nonEmptyLines[i], i + 1);

      if ("reason" in result) {
        invalidRows.push(result);
      } else {
        validRecords.push(result);
      }
    }

    if (invalidRows.length > 0) {
      throw new ParsingError(
        "Malformed CSV: Invalid column count or format detected.",
        invalidRows
      );
    }

    const dataTypeErrors = this.validateDataTypes(validRecords);
    if (dataTypeErrors.length > 0) {
      throw new DataValidationError(
        "Data validation error: Some rows contain invalid data types.",
        dataTypeErrors
      );
    }

    return validRecords;
  }

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
      const records = this.validateCsvFormat(lines);

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
