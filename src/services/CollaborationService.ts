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
      return new Date();
    }
    return new Date(dateStr);
  }

  private calculateOverlapDays(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): number {
    if (
      end1.getTime() === start2.getTime() ||
      end2.getTime() === start1.getTime()
    ) {
      return 1;
    }

    if (end1 < start2 || end2 < start1) {
      return 0;
    }

    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

    const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  private getPairKey(emp1: string, emp2: string): string {
    // Ensure consistent ordering of employee IDs for symmetry
    const [first, second] = [emp1, emp2].sort();
    return `${first}-${second}`;
  }

  findLongestCollaboration(records: CsvRecord[]): CollaborationPair[] {
    // Map to store total overlap days for each employee pair across all projects
    const pairOverlaps = new Map<string, CollaborationPair>();

    // Group records by project
    const projectGroups = new Map<string, CsvRecord[]>();
    records.forEach((record) => {
      const existing = projectGroups.get(record.projectId) || [];
      projectGroups.set(record.projectId, [...existing, record]);
    });

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

          if (overlapDays > 0) {
            // Use consistent key for the pair regardless of order
            const pairKey = this.getPairKey(
              record1.employeeId,
              record2.employeeId
            );

            if (!pairOverlaps.has(pairKey)) {
              pairOverlaps.set(pairKey, {
                employee1Id: record1.employeeId,
                employee2Id: record2.employeeId,
                totalDays: 0,
              });
            }

            // Add the overlap days to the total for this pair
            const currentPair = pairOverlaps.get(pairKey)!;
            currentPair.totalDays += overlapDays;
          }
        }
      }
    }

    // If no overlaps found, return empty array
    if (pairOverlaps.size === 0) {
      return [];
    }

    // Find the maximum overlap days
    const maxDays = Math.max(
      ...Array.from(pairOverlaps.values()).map((p) => p.totalDays)
    );

    // Return all pairs that have the maximum overlap days
    return Array.from(pairOverlaps.values())
      .filter((pair) => pair.totalDays === maxDays)
      .map((pair) => ({
        employee1Id: pair.employee1Id,
        employee2Id: pair.employee2Id,
        totalDays: pair.totalDays,
      }));
  }
}
