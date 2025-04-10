import { Service } from "typedi";

interface CsvRecord {
  employeeId: string;
  projectId: string;
  dateFrom: string;
  dateTo: string | null;
}

interface CollaborationPair {
  employee1Id: string;
  employee2Id: string;
  totalDays: number;
}

@Service()
export class CollaborationService {
  private parseDate(dateStr: string | null): Date {
    if (!dateStr) {
      return new Date(); // Use current date for null/undefined DateTo
    }
    return new Date(dateStr);
  }

  private calculateOverlapDays(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): number {
    // Handle boundary condition: if one period ends exactly when another begins
    if (
      end1.getTime() === start2.getTime() ||
      end2.getTime() === start1.getTime()
    ) {
      return 1; // Count as 1 day overlap
    }

    // No overlap if one period ends before another starts
    if (end1 < start2 || end2 < start1) {
      return 0;
    }

    // Calculate overlap period
    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

    // Calculate days between dates (inclusive of both start and end)
    const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  findLongestCollaboration(records: CsvRecord[]): CollaborationPair | null {
    // Group records by project
    const projectGroups = new Map<string, CsvRecord[]>();
    records.forEach((record) => {
      const existing = projectGroups.get(record.projectId) || [];
      projectGroups.set(record.projectId, [...existing, record]);
    });

    let maxOverlap = 0;
    let result: CollaborationPair | null = null;

    // Process each project group
    for (const [projectId, projectRecords] of projectGroups) {
      // Calculate overlaps for each pair of employees in the project
      for (let i = 0; i < projectRecords.length; i++) {
        for (let j = i + 1; j < projectRecords.length; j++) {
          const record1 = projectRecords[i];
          const record2 = projectRecords[j];

          // Skip if it's the same employee
          if (record1.employeeId === record2.employeeId) {
            continue;
          }

          // Calculate overlap days
          const start1 = this.parseDate(record1.dateFrom);
          const end1 = this.parseDate(record1.dateTo);
          const start2 = this.parseDate(record2.dateFrom);
          const end2 = this.parseDate(record2.dateTo);

          const overlapDays = this.calculateOverlapDays(
            start1,
            end1,
            start2,
            end2
          );

          // Update result if this is the longest collaboration
          if (overlapDays > maxOverlap) {
            maxOverlap = overlapDays;
            result = {
              employee1Id: record1.employeeId,
              employee2Id: record2.employeeId,
              totalDays: overlapDays,
            };
          }
        }
      }
    }

    return result;
  }
}
