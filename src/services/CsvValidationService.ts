import { Service } from "typedi";
import {
  InputValidationError,
  ParsingError,
  DataValidationError,
} from "../utils/errors";

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
export class CsvValidationService {
  private isEmptyOrUndefined(value: string | null | undefined): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    const trimmed = value.trim().toLowerCase();
    return !trimmed || trimmed === "undefined";
  }

  private isNullString(value: string | null | undefined): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    const trimmed = value.trim().toLowerCase();
    return trimmed === "null";
  }

  private isValidId(value: string): boolean {
    return /^\d+$/.test(value.trim());
  }

  private parseDate(dateStr: string): Date | null {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [_, year, month, day] = isoMatch;
      const parsedDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    const euMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (euMatch) {
      const [_, day, month, year] = euMatch;
      const parsedDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    const usMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (usMatch) {
      const [_, month, day, year] = usMatch;
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
        rowNumber: -1,
        reason:
          "Invalid date format in DateFrom. Expected YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY",
      };
    }

    if (!dateTo) {
      return null;
    }

    const toDate = this.parseDate(dateTo);
    if (!toDate) {
      return {
        rowNumber: -1,
        reason:
          "Invalid date format in DateTo. Expected YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY",
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

  private checkValidDelimiter(line: string): boolean {
    return line.includes(",");
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
    });

    return invalidRows;
  }

  private validateRow(
    line: string,
    rowNumber: number
  ): CsvRecord | ValidationError {
    if (!this.checkValidDelimiter(line)) {
      return {
        rowNumber,
        reason: "Invalid delimiter. Expected comma-separated values (CSV)",
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

    const fromDate = this.parseDate(dateFrom);
    if (!fromDate) {
      return {
        rowNumber,
        reason:
          "Invalid date format in DateFrom. Expected YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY",
      };
    }

    if (this.isEmptyOrUndefined(dateTo)) {
      return {
        employeeId: empId,
        projectId: projectId,
        dateFrom: dateFrom,
        dateTo: null,
      };
    } else if (this.isNullString(dateTo)) {
      return {
        rowNumber,
        reason:
          'Value "null" is not allowed for DateTo. Use empty value instead.',
      };
    } else {
      const toDate = this.parseDate(dateTo);
      if (!toDate) {
        return {
          rowNumber,
          reason:
            "Invalid date format in DateTo. Expected YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY",
        };
      }

      if (fromDate > toDate) {
        return {
          rowNumber,
          reason: "DateFrom is later than DateTo",
        };
      }

      return {
        employeeId: empId,
        projectId: projectId,
        dateFrom: dateFrom,
        dateTo: dateTo,
      };
    }
  }

  private validateIntervals(records: CsvRecord[]): ValidationError[] {
    const invalidRows: ValidationError[] = [];
    const intervalMap = new Map<string, DateInterval[]>();

    records.forEach((record, index) => {
      const key = `${record.employeeId}-${record.projectId}`;
      const fromDate = this.parseDate(record.dateFrom);
      const toDate = record.dateTo ? this.parseDate(record.dateTo) : new Date();

      if (!fromDate || !toDate) return;

      const interval: DateInterval = {
        dateFrom: fromDate,
        dateTo: toDate,
        rowNumber: index + 1,
      };

      const existingIntervals = intervalMap.get(key) || [];
      intervalMap.set(key, [...existingIntervals, interval]);
    });

    for (const [key, intervals] of intervalMap.entries()) {
      if (intervals.length <= 1) continue;

      intervals.sort((a, b) => a.dateFrom.getTime() - b.dateFrom.getTime());

      for (let i = 0; i < intervals.length - 1; i++) {
        const current = intervals[i];
        const next = intervals[i + 1];

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

  public validateCsvFormat(lines: string[]): CsvRecord[] {
    const MAX_LINES = 10000;
    if (lines.length > MAX_LINES) {
      throw new InputValidationError(
        `File exceeds maximum line count (${MAX_LINES}). Please reduce file size.`
      );
    }

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

    const intervalErrors = this.validateIntervals(validRecords);
    if (intervalErrors.length > 0) {
      throw new DataValidationError(
        "Data validation error: Overlapping intervals detected.",
        intervalErrors
      );
    }

    return validRecords;
  }
}
