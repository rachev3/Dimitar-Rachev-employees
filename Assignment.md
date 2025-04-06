# Employee Collaboration Analyzer – Backend Developer Test

## Overview

Your task is to build an application that analyzes employee project data and identifies the pair of employees who have worked together on common projects for the longest period of time.

The application will ingest a CSV file with employee project assignments and calculate which two employees have the highest total overlapping workdays on the same projects. For example, given the sample input below, the expected output might be:

```
Input Row Example:
143, 12, 2013-11-01, 2014-01-05
218, 10, 2011-04-16, undefined
143, 10, 2009-01-01, 2011-04-27

Expected Output:
143, 218, 11
```

> Note: The sample output indicates the pair of employees and the total period (in an appropriate unit) they worked together. Handle cases where the "DateTo" is undefined by treating it as today's date.

## Tech Stack

- **Programming Language**: TypeScript, Node.js
- **Frameworks & Libraries**:
  - Express
  - routing-controllers
  - typedi
  - Mongoose (for ORM)
- **Database**: MongoDB
- **Authentication**: JWT Tokens
- **Testing**: Jest (for unit tests)
- **Containerization (Bonus)**: Docker

## Technical Requirements

- **Language & Frameworks**:

  - Use **TypeScript** and **Node.js**.
  - Use **Express** for building your RESTful APIs.
  - Leverage **routing-controllers** for cleaner controller definitions.
  - Use **typedi** for dependency injection to manage your services and controllers.

- **Database & ORM**:

  - Use **MongoDB** as the database.
  - Use **Mongoose** as the ORM to interact with MongoDB.

- **Authentication**:

  - Implement authentication for all GET endpoints using **JWT tokens**.
  - Ensure that each request includes a valid JWT token to access protected endpoints.
  - Provide endpoints for login and token generation so that clients can obtain a valid JWT token.

### Admin Seed Script

- Implement a seed script that checks if an initial admin user exists in the database.
- If no admin exists, the script should create one using credentials provided via environment variables (e.g., `ADMIN_EMAIL` and `ADMIN_PASSWORD`).
- This ensures the initial admin account is created automatically on startup or through a one-time script run.

## APIs

- Develop CRUD (Create, Read, Update, Delete) APIs for managing **users** and **projects**.
- Ensure that endpoints follow REST best practices.

## Functional Requirements

1. **CSV Parsing and Processing**:

   - Build functionality to upload and parse a CSV file containing the following fields:
     - EmpID
     - ProjectID
     - DateFrom
     - DateTo (if undefined, assume current date)
   - Process this data to calculate overlapping work periods for employees on shared projects.

2. **Employee Pair Calculation**:

   - Calculate and determine the pair of employees who have worked together on common projects for the longest total time.
   - Return the result in the format: `EmployeeID1, EmployeeID2, TotalTimeTogether`.

3. **CRUD Operations**:

   - Create endpoints for managing users and projects.
   - Use the MongoDB database and Mongoose for data persistence.

4. **Authentication**:
   - Secure all GET endpoints by implementing JWT token-based authentication.
   - Provide endpoints for login and token generation so that clients can obtain a valid JWT token.

## Testing & Quality Assurance

- Write tests covering all possible edge cases (e.g., invalid dates, missing fields, overlapping projects with various date scenarios).
- **Bonus**:
  - Use **Jest** for unit testing your CRUD APIs.
  - Consider testing the CSV parsing logic and employee pair calculation thoroughly.

## Deployment & Containerization

- **Bonus**:
  - Use **Docker** to containerize the application. The project should be runnable on any local environment with Docker installed.
  - Provide a Dockerfile and docker-compose configuration if necessary.

## Repository & Submission Guidelines

- Include clear instructions in the README on how to install dependencies, run the application, execute tests, and launch the Docker container.
- Make sure your code is well-structured, commented, and follows best practices for TypeScript and Node.js development.

## Deliverables

- Complete source code in a public repository.
- README with detailed setup and usage instructions.
- Unit tests covering all the critical paths and edge cases.
- (Bonus) Docker setup enabling the application to run in a containerized environment.
