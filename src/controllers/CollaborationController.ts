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

interface DateInterval {
  dateFrom: Date;
  dateTo: Date;
  rowNumber: number;
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

  private parseDate(dateStr: string): Date | null {
    // Try parsing ISO 8601 format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing YYYY-MM-DD format
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [_, year, month, day] = match;
      const parsedDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    return null;
  }

  private isValidDate(dateStr: string): boolean {
    return this.parseDate(dateStr) !== null;
  }

  private validateDateRange(
    dateFrom: string,
    dateTo: string | null
  ): ValidationError | null {
    const fromDate = this.parseDate(dateFrom);
    if (!fromDate) {
      return {
        rowNumber: -1, // Will be updated by caller
        reason: "Invalid date format in DateFrom. Expected YYYY-MM-DD",
      };
    }

    if (!dateTo) {
      return null; // No DateTo is valid, will be replaced with current date
    }

    const toDate = this.parseDate(dateTo);
    if (!toDate) {
      return {
        rowNumber: -1,
        reason: "Invalid date format in DateTo. Expected YYYY-MM-DD",
      };
    }

    if (fromDate > toDate) {
      return {
        rowNumber: -1,
        reason: "DateFrom is later than DateTo",
      };
    }

    return null;
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

      // Date validations
      const dateError = this.validateDateRange(record.dateFrom, record.dateTo);
      if (dateError) {
        dateError.rowNumber = index + 1;
        invalidRows.push(dateError);
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

    // Date validations
    const dateError = this.validateDateRange(dateFrom, dateTo || null);
    if (dateError) {
      dateError.rowNumber = rowNumber;
      return dateError;
    }

    return {
      employeeId: empId,
      projectId: projectId,
      dateFrom: dateFrom,
      dateTo: this.isEmptyOrUndefined(dateTo) ? null : dateTo,
    };
  }

  private validateIntervals(records: CsvRecord[]): ValidationError[] {
    const invalidRows: ValidationError[] = [];
    const intervalMap = new Map<string, DateInterval[]>();

    // Group intervals by employee and project
    records.forEach((record, index) => {
      const key = `${record.employeeId}-${record.projectId}`;
      const fromDate = this.parseDate(record.dateFrom);
      const toDate = record.dateTo ? this.parseDate(record.dateTo) : new Date();

      if (!fromDate || !toDate) return; // Skip invalid dates (they're caught in earlier validation)

      const interval: DateInterval = {
        dateFrom: fromDate,
        dateTo: toDate,
        rowNumber: index + 1,
      };

      const existingIntervals = intervalMap.get(key) || [];
      intervalMap.set(key, [...existingIntervals, interval]);
    });

    // Check each group for overlaps
    for (const [key, intervals] of intervalMap.entries()) {
      if (intervals.length <= 1) continue;

      // Sort intervals by start date
      intervals.sort((a, b) => a.dateFrom.getTime() - b.dateFrom.getTime());

      // Check for overlaps
      for (let i = 0; i < intervals.length - 1; i++) {
        const current = intervals[i];
        const next = intervals[i + 1];

        // Check if intervals overlap
        if (current.dateTo >= next.dateFrom) {
          const [empId, projId] = key.split("-");
          invalidRows.push({
            rowNumber: next.rowNumber,
            reason: `Overlapping period detected for Employee ${empId} on Project ${projId}. Previous period ends on ${
              current.dateTo.toISOString().split("T")[0]
            }`,
          });
        }
      }
    }

    return invalidRows;
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

    // Add interval validation
    const intervalErrors = this.validateIntervals(validRecords);
    if (intervalErrors.length > 0) {
      throw new DataValidationError(
        "Data validation error: Overlapping intervals detected.",
        intervalErrors
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
        return {
          success: true,
          message:
            "No overlapping work periods found between any pair of employees.",
          result: [],
        };
      }

      return {
        success: true,
        result: [
          longestCollaboration.employee1Id,
          longestCollaboration.employee2Id,
          longestCollaboration.totalDays,
        ],
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
