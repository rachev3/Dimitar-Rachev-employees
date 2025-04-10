import {
  JsonController,
  Post,
  Req,
  UseBefore,
  Authorized,
} from "routing-controllers";
import type { Request } from "express";
import { Service } from "typedi";
import multer from "multer";

const upload = multer();

@Service()
@JsonController("/collaboration")
export class CollaborationController {
  @Post("/analyze")
  @Authorized()
  @UseBefore(upload.single("file"))
  async analyzeCollaboration(@Req() request: Request) {
    try {
      if (!request.file) {
        throw new Error("No file uploaded");
      }

      const fileContent = request.file.buffer.toString();
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

      return {
        success: true,
        data: records,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: "Failed to process CSV file",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
