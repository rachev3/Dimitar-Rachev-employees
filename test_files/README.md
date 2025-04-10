# CSV Test Files for Collaboration Analyzer

This directory contains a comprehensive set of CSV files to test all aspects of the collaboration analysis application.

## Valid Test Files

1. **valid_data.csv**

   - Standard valid data with correct format
   - Tests basic functionality and finding longest collaborations

2. **valid_with_alternative_dates.csv**

   - Valid data with various date formats (ISO, European, US)
   - Tests date format flexibility

3. **valid_boundary_condition.csv**
   - Tests the boundary condition where one employee's end date is the same as another's start date
   - Should count as 1 day overlap

## Format Validation Test Files

5. **empty_file.csv**

   - Empty file
   - Should return appropriate error message

6. **whitespace_only.csv**

   - File with only whitespace
   - Should be treated as empty

7. **wrong_delimiter.csv**

   - Uses semicolons instead of commas
   - Tests delimiter validation

8. **wrong_column_count.csv**
   - Has rows with fewer or more than 4 columns
   - Tests column count validation

## Data Validation Test Files

9. **invalid_ids.csv**

   - Contains non-numeric IDs
   - Tests ID validation

10. **invalid_dates.csv**

    - Contains invalid date formats and ranges
    - Tests date parsing and validation

11. **missing_required_fields.csv**
    - Missing EmpID, ProjectID, or DateFrom
    - Tests required field validation

## Interval Validation Test Files

12. **overlapping_intervals.csv**
    - Contains overlapping periods for the same employee on the same project
    - Tests interval validation

## Special Case Files

13. **no_overlap_periods.csv**

    - Valid data but with no overlapping work periods
    - Should return "No overlapping work periods found" message

14. **multiple_same_max_pairs.csv**

    - Contains multiple employee pairs with identical maximum collaboration days
    - Tests tie handling by returning all pairs with maximum days

15. **many_lines.csv**
    - Contains many lines but within limits
    - Tests performance with larger datasets

## Testing Procedure

1. Use Postman to send each file to the `/collaboration/analyze` endpoint
2. Verify that the application returns the expected response
