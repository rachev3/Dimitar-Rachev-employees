import { Service } from "typedi";

interface EmployeeAssignment {
  employeeId: string;
  projectId: string;
  dateFrom: string;
  dateTo: string | null;
}

interface EmployeePair {
  employee1Id: string;
  employee2Id: string;
  totalDays: number;
}

@Service()
export class CollaborationService {
  findLongestCollaboration(records: EmployeeAssignment[]): EmployeePair | null {
    if (!records || records.length < 2) {
      return null;
    }

    const processedRecords = this.processRecords(records);

    const projectGroups = this.groupByProject(processedRecords);

    const employeePairsMap = this.computeOverlaps(projectGroups);

    return this.findMaxOverlap(employeePairsMap);
  }

  private processRecords(records: EmployeeAssignment[]): EmployeeAssignment[] {
    const currentDate = new Date().toISOString().split("T")[0];

    return records.map((record) => {
      const processed = { ...record };

      if (!processed.dateTo) {
        processed.dateTo = currentDate;
      }

      return processed;
    });
  }

  private groupByProject(
    records: EmployeeAssignment[]
  ): Record<string, EmployeeAssignment[]> {
    const groups: Record<string, EmployeeAssignment[]> = {};

    for (const record of records) {
      if (!groups[record.projectId]) {
        groups[record.projectId] = [];
      }
      groups[record.projectId].push(record);
    }

    return groups;
  }

  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return 0;
    }

    const timeDiff = Math.abs(d2.getTime() - d1.getTime());

    return Math.round(timeDiff / (1000 * 3600 * 24));
  }

  private calculateOverlap(
    assignment1: EmployeeAssignment,
    assignment2: EmployeeAssignment
  ): number {
    const start1 = assignment1.dateFrom;
    const end1 = assignment1.dateTo!;
    const start2 = assignment2.dateFrom;
    const end2 = assignment2.dateTo!;

    const overlapStart = new Date(start1) > new Date(start2) ? start1 : start2;
    const overlapEnd = new Date(end1) < new Date(end2) ? end1 : end2;

    if (new Date(overlapStart) > new Date(overlapEnd)) {
      return 0;
    }
    return this.daysBetween(overlapStart, overlapEnd);
  }

  private computeOverlaps(
    projectGroups: Record<string, EmployeeAssignment[]>
  ): Map<string, EmployeePair> {
    const pairsMap = new Map<string, EmployeePair>();

    for (const projectId in projectGroups) {
      const assignments = projectGroups[projectId];

      for (let i = 0; i < assignments.length; i++) {
        for (let j = i + 1; j < assignments.length; j++) {
          const emp1 = assignments[i];
          const emp2 = assignments[j];

          if (emp1.employeeId === emp2.employeeId) {
            continue;
          }

          const [employee1Id, employee2Id] = [
            emp1.employeeId,
            emp2.employeeId,
          ].sort();
          const pairKey = `${employee1Id}-${employee2Id}`;

          const overlapDays = this.calculateOverlap(emp1, emp2);

          if (overlapDays > 0) {
            if (!pairsMap.has(pairKey)) {
              pairsMap.set(pairKey, {
                employee1Id,
                employee2Id,
                totalDays: 0,
              });
            }

            const pairData = pairsMap.get(pairKey)!;
            pairData.totalDays += overlapDays;
          }
        }
      }
    }

    return pairsMap;
  }

  private findMaxOverlap(
    pairsMap: Map<string, EmployeePair>
  ): EmployeePair | null {
    let maxPair: EmployeePair | null = null;
    let maxDays = 0;

    for (const [_, pair] of pairsMap.entries()) {
      if (pair.totalDays > maxDays) {
        maxDays = pair.totalDays;
        maxPair = pair;
      }
    }

    return maxPair;
  }
}
