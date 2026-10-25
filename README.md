# Waste Management System Software Quality Assurance and Testing

## 1. Project Overview

The Waste Management System (WMS) is a web-based application developed to support the management of residential waste collection requests.

The system allows residents to register, manage their addresses, submit waste collection requests and monitor their request statuses. Administrators can manage residents, collector accounts, waste categories and waste collection requests, including approving requests and assigning collectors.

This repository contains the **Software Quality Assurance (SQA) version** of the application, developed to evaluate the existing system and introduce a structured software testing and quality assurance process.

The assessment focuses on identifying quality gaps in the original application, designing and implementing automated tests, evaluating system behaviour and introducing Continuous Integration (CI) to support repeatable quality checks.

The SQA implementation uses a local PostgreSQL database and is not deployed on Vercel.

### Project Objectives

- Evaluate the baseline quality assurance practices of the existing application.
- Identify quality gaps and propose appropriate improvements.
- Implement automated unit, integration and end-to-end tests.
- Evaluate application performance under different load conditions.
- Verify authentication, authorisation, input validation and data integrity.
- Establish a Continuous Integration pipeline for automated quality checks.
- Document test cases, execution results, defects and quality improvements.

---

## 2. Technology Stack

| Category | Technology |
|---|---|
| Frontend | Next.js 16, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js App Router API Route Handlers |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Authentication | NextAuth |
| Unit Testing | Vitest |
| Integration Testing | Vitest and PostgreSQL |
| End-to-End Testing | Playwright |
| Performance Testing | k6 |
| Code Coverage | Vitest with V8 |
| Continuous Integration | GitHub Actions |
| Version Control | Git and GitHub |

---

## 3. System Functionality

The application currently provides functionality for two implemented user interfaces: **Administrator** and **Resident**.

### 3.1 Administrator Functionality

Administrators can:

- Authenticate and access the administrator dashboard.
- View system statistics and waste request summaries.
- View resident and collector information.
- Create and manage resident accounts.
- Create and manage collector accounts.
- Create and manage waste categories.
- View and manage waste collection requests.
- Approve eligible waste collection requests.
- Assign collectors to approved requests.
- View request statuses and related activities.
- Update administrator account settings.
- Log out of the application.

### 3.2 Resident Functionality

Residents can:

- Register and log in to the application.
- Access their personal dashboard.
- Create and manage saved pickup addresses.
- Submit waste collection requests.
- View submitted requests and their statuses.
- View individual waste request details.
- Update eligible waste collection requests.
- Cancel eligible requests.
- Update account settings.
- Log out of the application.

### 3.3 Collector Functionality

The system supports the creation of collector accounts and the assignment of waste collection requests to collectors.

However, a dedicated **Collector dashboard and interface have not been implemented** in the current application.

Collector-facing workflows are therefore outside the implemented scope of this SQA assessment.

---

## 4. Software Quality Assurance Approach

The SQA activities were designed to assess the application's functional correctness, reliability, security-related behaviour, maintainability and performance.

The quality evaluation draws on established software quality frameworks and standards, including:

- **ISO/IEC 25010:** Software product quality characteristics.
- **ISO/IEC 5055:** Automated source-code quality measures.
- **ISO/IEC/IEEE 29119:** Software testing processes and documentation.
- **McCall's Quality Model:** Software quality factors.
- **CMMI:** Process maturity and continuous improvement.

The assessment applies these frameworks to evaluate the baseline application, identify gaps and guide the implementation of improved testing practices.

---

## 5. Testing Strategy

Four testing levels were implemented to evaluate the application.

### 5.1 Unit Testing

**Framework:** Vitest

Unit tests verify individual API handlers and application logic in isolation.

The tests cover:

- Authentication and role-based authorisation.
- Resident registration and validation.
- Waste collection request creation and retrieval.
- Request updates and cancellation.
- Address management.
- Administrator request approval and collector assignment.
- Resident and collector account management.
- Invalid inputs and error handling.
- Ownership restrictions and access control.

External dependencies are mocked where appropriate to isolate the behaviour under test.

**Execution command:**

```bash
npm run test
```

### 5.2 Integration Testing

**Framework:** Vitest with PostgreSQL and Prisma

Integration tests verify interactions between application components and the database.

The tests cover:

- Database persistence and retrieval.
- Resident address ownership.
- Waste collection request creation.
- Database transaction handling.
- Transaction rollback following failures.
- Request status changes.
- Administrative workflows.
- Data consistency and access restrictions.

A dedicated PostgreSQL test database is used to isolate test data from the development database.

**Execution command:**

```bash
npm run test:integration
```

### 5.3 End-to-End Testing

**Framework:** Playwright (Chromium)

End-to-end tests simulate user interactions through the application interface.

The tests cover:

- Login and authentication behaviour.
- Access restrictions between user roles.
- Resident waste collection request workflows.
- Address creation through the interface.
- Form validation.
- Administrator request management.

**Execution command:**

```bash
npm run test:e2e
```

### 5.4 Performance Testing

**Framework:** k6

Performance testing evaluates application behaviour under different request loads.

Four performance testing scenarios were implemented:

| Scenario | Script | Purpose |
|---|---|---|
| Baseline Load | `baseline.js` | Evaluate response behaviour under baseline traffic |
| Concurrent Load | `concurrent-load.js` | Evaluate simultaneous requests |
| Increased Load | `increased-load.js` | Evaluate behaviour as the load increases |
| Authenticated Requests | `authenticated-requests.js` | Evaluate authenticated request performance |

The configured performance thresholds are:

- **95th-percentile response time:** Below 2,000 milliseconds.
- **HTTP request failure rate:** Below 1%.

The performance scenarios use short-duration loads of up to 10 virtual users.

Performance testing was conducted separately from the GitHub Actions CI pipeline.

Some earlier executions exceeded the response-time threshold, while subsequent retests passed. These observations are considered when evaluating performance consistency.

The scripts are available in:

```text
tests/performance/
```

**Example execution command:**

```bash
k6 run tests/performance/baseline.js
```

---

## 6. Automated Test Results

The following results were recorded during the SQA assessment.

| Testing Level | Total Tests | Passed | Failed |
|---|---:|---:|---:|
| Unit/API Testing | 307 | 307 | 0 |
| Integration Testing | 114 | 114 | 0 |
| End-to-End Testing | 20 | 20 | 0 |
| **Total** | **441** | **441** | **0** |

These results represent the recorded successful executions of the automated functional test suites.

The four performance testing scenarios are documented separately because they use load metrics and thresholds rather than the same individual test-counting approach.

### 6.1 Unit Test Code Coverage

Coverage was measured using Vitest and the V8 coverage provider.

| Coverage Metric | Recorded Coverage |
|---|---:|
| Statements | 64.25% |
| Branches | 71.89% |
| Lines | 64.66% |
| Functions | 46.42% |

**Coverage command:**

```bash
npm run test:coverage
```

The results demonstrate automated verification across the tested application components, while also identifying opportunities for further coverage improvement, particularly function coverage.

---

## 7. Test Case Documentation

A consolidated test-case document was prepared to support the SQA assessment.

The document includes:

- Test identifiers.
- Test scenarios.
- Expected outcomes.
- Test execution status.
- Unit/API testing cases.
- Integration testing cases.
- End-to-end testing cases.
- Performance testing scenarios.

### [View the Complete SQA Test Case Document](docs/WMS_SQA_Test_Cases.pdf)

The corresponding automated test implementations are available in the `tests/` directory.

The test-case register provides a readable overview of the tests, while the source code and execution evidence provide the detailed technical verification.

---


## 8. Continuous Integration (CI)
A Continuous Integration pipeline was implemented using GitHub Actions to automate software quality checks and support consistent testing of the Waste Management System.

The workflow is defined in the `.github/workflows/` directory and is named **Waste Management SQA Tests**.

### 8.1 Workflow Triggers

The CI workflow runs automatically when:

- Changes are pushed to the `main` branch.
- A pull request targets the `main` branch.
- The workflow is manually triggered using `workflow_dispatch`.

### 8.2 CI Environment

The pipeline executes on a GitHub-hosted Ubuntu runner with a maximum execution time of 30 minutes.

| Component | Configuration |
|---|---|
| CI Platform | GitHub Actions |
| Operating System | Ubuntu (latest available runner) |
| Node.js | Version 20 |
| Database | PostgreSQL 16 |
| Database Isolation | Dedicated CI test database |
| ORM | Prisma |
| Unit Testing | Vitest |
| Integration Testing | Vitest and PostgreSQL |
| Application Build | Next.js |
| End-to-End Testing | Playwright (Chromium) |

The PostgreSQL database is provisioned as a GitHub Actions service container. Database health checks are performed before dependent steps execute.

### 8.3 Automated CI Execution

The workflow performs the following activities:

1. **Repository checkout:** Retrieves the latest project source code using `actions/checkout@v4`.
2. **Node.js setup:** Configures Node.js 20 with npm dependency caching.
3. **Dependency installation:** Runs `npm ci` to install dependencies from the lockfile.
4. **Test environment configuration:** Creates `.env.test` and `.env.e2e` using CI environment variables.
5. **Prisma Client generation:** Executes `npx prisma generate`.
6. **Database migration:** Applies the existing database migrations using `npx prisma migrate deploy`.
7. **Unit testing:** Executes `npm test`.
8. **Integration testing:** Executes `npm run test:integration`.
9. **Application build:** Executes `npm run build`.
10. **Browser setup:** Installs Chromium and its required dependencies.
11. **End-to-end testing:** Executes `npm run test:e2e`.
12. **Evidence collection:** Uploads available Playwright reports and test results as workflow artifacts.

These automated checks help identify defects and integration problems before changes are accepted into the main development branch.

### 8.4 CI Execution Results

A successful execution of the GitHub Actions workflow was recorded on the personal GitHub repository.

The recorded automated functional testing results are:

| Testing Level | Passed | Failed |
|---|---:|---:|
| Unit/API | 307 | 0 |
| Integration | 114 | 0 |
| End-to-End | 20 | 0 |
| **Total** | **441** | **0** |

These results represent the recorded testing outcomes. The GitHub Actions execution history provides supporting evidence of the automated pipeline.

**[View GitHub Actions Execution History](https://github.com/olaoluwasubomi/waste-management-sqa/actions)**

### 8.5 CI Test Evidence

The workflow is configured to upload two Playwright artifacts:

- `playwright-report`: The generated Playwright test report.
- `playwright-test-results`: The available Playwright test-result files.

Both artifacts are configured with a seven-day retention period.

The upload steps use `if: always()` to attempt evidence collection even if an earlier step fails. Missing artifact directories are ignored rather than causing an additional failure.

### 8.6 CI Scope and Limitations

The implemented workflow provides Continuous Integration but does not perform Continuous Deployment.

The following activities are not included in the current CI pipeline:

- Automated deployment to a hosting environment.
- k6 performance testing.
- Dedicated static or dynamic security scanning.
- Enforced code coverage thresholds.

Performance tests were executed separately from the CI workflow.

The GitHub Actions pipeline was executed on the personal GitHub repository, while the Coventry University GitHub Enterprise repository is maintained for assessment submission.

---

## 9. Local Development Setup

### Prerequisites

Ensure the following tools are installed:

- Node.js 20.
- npm.
- PostgreSQL 16.
- Git.

Playwright browser dependencies and k6 are also required when executing the corresponding test suites.

### Step 1: Clone the Repository

```bash
git clone https://github.com/olaoluwasubomi/waste-management-sqa.git
cd waste-management-sqa
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file using the repository's environment example, where available.

Configure the required database connection and authentication variables for your local environment.

For example:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/waste_management"
```

Replace the placeholder values with your local PostgreSQL credentials.

Do not commit real passwords, authentication secrets or production environment files to the repository.

### Step 4: Prepare the Database

Ensure PostgreSQL is running and the configured database exists.

Apply the Prisma migrations:

```bash
npx prisma migrate deploy
```

Generate the Prisma client:

```bash
npx prisma generate
```

### Step 5: Start the Application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Step 6: Execute Automated Tests

**Unit tests:**

```bash
npm run test
```

**Unit test coverage:**

```bash
npm run test:coverage
```

**Integration tests:**

```bash
npm run test:integration
```

Integration tests require the dedicated PostgreSQL test environment to be configured.

**End-to-end tests:**

```bash
npx playwright install chromium
npm run test:e2e
```

**Performance tests:**

```bash
k6 run tests/performance/baseline.js
```

The performance test scripts require the appropriate application and authentication setup for their respective scenarios.

---

## 10. Defect Identification and Quality Improvements

The SQA process included defect identification, correction and regression testing.

An example identified during testing involved pagination parameter validation in resident waste request retrieval.

Malformed numeric values could previously be partially interpreted as valid numbers. The validation logic was improved to require valid positive integer inputs, and the affected tests were rerun successfully.

The testing process also supported verification of:

- Role-based access restrictions.
- Resident data ownership.
- Invalid request handling.
- Database transaction consistency.
- Request lifecycle rules.
- Input validation.
- Error responses.

These activities demonstrate how automated testing can support defect detection and verification of corrective changes.

---

## 11. Known Limitations

The current SQA implementation has several limitations:

1. The Collector dashboard and collector-facing workflows have not been implemented.
2. Automated testing does not cover every application function or code path.
3. Function coverage remains lower than other recorded coverage measures.
4. Performance results may vary across executions and testing environments.
5. Performance tests are executed separately from CI.
6. The CI workflow does not perform automated deployment.
7. Dedicated security scanning and penetration testing are outside the implemented assessment scope.
8. The application is evaluated using a local PostgreSQL environment and is not deployed on Vercel.

These limitations inform the recommendations for future software quality improvements.

---

## 12. Future Improvements

Potential future improvements include:

- Implementing the Collector interface and its associated workflows.
- Increasing automated coverage of currently untested functions.
- Introducing coverage thresholds into CI.
- Adding automated security scanning.
- Expanding performance testing to longer and higher-load scenarios.
- Integrating performance testing into a suitable CI process.
- Introducing Continuous Deployment where appropriate.
- Improving test reporting and long-term quality monitoring.

---

## 13. Repository Links

**Coventry University Assessment Repository**

https://github.coventry.ac.uk/abiolao5/17418030-waste-management-sqa

**Personal GitHub Repository (CI Execution Evidence)**

https://github.com/olaoluwasubomi/waste-management-sqa

The Coventry University repository contains the SQA assessment implementation, while the personal repository also provides access to the GitHub Actions execution history.

---

## 14. Conclusion

The Software Quality Assurance assessment demonstrates the application of structured testing practices to an existing Waste Management System.

By introducing automated unit, integration, end-to-end and performance testing, the project provides evidence of improved verification across the implemented administrator and resident functionality.

The recorded successful execution of 441 automated functional tests, together with code coverage analysis and GitHub Actions Continuous Integration, demonstrates progress from the original baseline towards a more systematic and repeatable quality assurance process.

The assessment also identifies remaining limitations and opportunities for further improvement in test coverage, performance consistency, security assurance and continuous delivery.
