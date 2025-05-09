# Collaboration Module Documentation

## Overview

The Collaboration Module is a component of the Employee system that analyzes employee collaboration patterns on projects. The primary functionality is to identify pairs of employees who have worked together on the same projects for the most days.

## Architecture

The module follows a layered architecture pattern:

1. **Controller Layer** - `CollaborationController`: Handles HTTP requests and file uploads
2. **Service Layer** - `CollaborationService` and `CsvValidationService`: Implements business logic
3. **Error Handling** - Custom error classes for different validation scenarios

```
src/
├── controllers/
│   └── CollaborationController.ts - Handles HTTP request processing and file uploads
├── services/
│   ├── CollaborationService.ts    - Core collaboration analysis algorithm
│   └── CsvValidationService.ts    - CSV data validation and parsing
└── utils/
    ├── errors.ts                  - Custom error classes
    └── responseFormatter.ts       - Standardized API response structure
```

## API Endpoint

### Analyze Collaboration

**Endpoint:** `POST /api/collaboration/analyze`

**Authentication:** Required (JWT token)

**Parameters:**

- `file` (multipart/form-data): CSV file containing employee-project data

**Response:**

- Success: `200 OK` with array of [employee1Id, employee2Id, totalDays]
- Error: Appropriate error code with detailed validation message

## CSV File Format

### Required Structure

The CSV file must have the following structure:

```
EmployeeID, ProjectID, DateFrom, DateTo
```

### Field Specifications

| Field      | Type      | Format                                        | Required | Description                                          |
| ---------- | --------- | --------------------------------------------- | -------- | ---------------------------------------------------- |
| EmployeeID | Number    | Integer                                       | Yes      | Unique identifier for employee                       |
| ProjectID  | Number    | Integer                                       | Yes      | Unique identifier for project                        |
| DateFrom   | Date      | YYYY-MM-DD, DD.MM.YYYY, MM/DD/YYYY            | Yes      | Start date of work period                            |
| DateTo     | Date/Null | YYYY-MM-DD, DD.MM.YYYY, MM/DD/YYYY, undefined | No       | End date of work period (current date if null/empty) |

### Example

```csv
143, 12, 2013-11-01, 2014-01-05
218, 12, 2013-12-06, 2014-02-28
143, 10, 2014-01-06, 2014-03-15
```

## Collaboration Algorithm

The algorithm for finding the longest collaborations follows these steps:

1. **Data Ingestion & Parsing:**

   - Read and validate the CSV file
   - Convert date strings to Date objects (current date for null values)

2. **Group by Project:**

   - Organize records by ProjectID
   - Create a map of projects to their associated employee records

3. **Compute Overlaps Within Each Project:**

   - For each project, compare all unique pairs of employees
   - Calculate overlapping work periods using:
     ```
     overlap_start = max(employee1.DateFrom, employee2.DateFrom)
     overlap_end = min(employee1.DateTo, employee2.DateTo)
     overlap_days = (overlap_end - overlap_start) / (24 * 60 * 60 * 1000) + 1
     ```
   - Track total overlap days per employee pair across all projects

4. **Identify Maximum Collaboration:**
   - Find the employee pair(s) with the maximum total overlap days
   - Return all pairs that have the same maximum value

## Validation Mechanisms

### File Validation

- Maximum file size: 10MB
- Valid file type: CSV (content type or extension)

### Format Validation

- Comma-separated values
- Exactly 4 columns per row
- Non-empty required fields

### Data Type Validation

- EmployeeID and ProjectID must be numeric
- Dates must follow valid formats
- DateFrom must be earlier than or equal to DateTo

### Interval Validation

- No overlapping time periods for the same employee on the same project

## Error Handling

### Error Types

1. **InputValidationError**: File format and structure errors

   - Invalid file type
   - Empty file
   - Exceeded file size
   - Missing required fields
   - Wrong delimiter or column count

2. **ParsingError**: Data format errors

   - Invalid format in columns

3. **DataValidationError**: Business logic validation errors
   - Invalid data types
   - Overlapping intervals
   - Invalid date ranges

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [
      {
        "rowNumber": 3,
        "reason": "Specific validation error for this row"
      }
    ]
  }
}
```

## Testing

The collaboration module includes an extensive set of test cases in the `test_files` directory, including:

- Valid data cases
- Format validation cases
- Data validation cases
- Interval validation cases
- Special cases like no overlaps or ties

Refer to the `test_files/README.md` for details on each test file.

## Limitations and Performance Considerations

- Maximum file size: 10MB
- Maximum line count: 10,000 lines
- Performance optimized for batch processing rather than real-time analysis
- Date parsing supports ISO (YYYY-MM-DD), European (DD.MM.YYYY), and US (MM/DD/YYYY) formats

## Security Considerations

- JWT authentication required to access the endpoint
- Rate limiting implemented to prevent abuse
- File size restrictions to prevent DoS attacks
- Input validation to prevent injection attacks

## Usage Examples

### Example 1: Finding Longest Collaborations

**Input CSV:**

```csv
143, 12, 2013-11-01, 2014-01-05
218, 12, 2013-12-06, 2014-02-28
143, 10, 2014-01-06, 2014-03-15
218, 10, 2014-01-10, 2014-01-20
```

**Result:**

```json
{
  "success": true,
  "data": [["143", "218", 55]]
}
```

The pair of employees 143 and 218 worked together for 55 days total across projects 10 and 12.

### Example 2: Multiple Pairs with Same Collaboration Time

**Input CSV:**

```csv
143, 12, 2013-11-01, 2014-01-05
218, 12, 2013-12-06, 2014-02-28
143, 10, 2014-01-06, 2014-03-15
218, 10, 2014-01-10, 2014-01-20
143, 11, 2014-02-01, 2014-02-28
145, 11, 2014-01-15, 2014-02-15
```

**Result:**

```json
{
  "success": true,
  "data": [
    ["143", "218", 55],
    ["143", "145", 28]
  ]
}
```

Here, both pairs worked together for the same number of days, so both are returned.
