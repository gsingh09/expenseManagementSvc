# Expense Management Service

A scalable, enterprise-grade expense management platform with configurable multi-level approval workflows and role-based access control.

## Features

- **Multi-Tenant**: Isolated organizations with per-org configurations
- **Configurable Approval Workflows**: Three strategies - HIERARCHY, ROLE_BASED, CUSTOM
- **Manager Hierarchy**: Self-referencing manager chains for organizational structure
- **Role-Based Access**: Dynamic role assignments with approval levels
- **Audit Logging**: Complete audit trail of all expense operations
- **Zero Hardcoding**: All logic driven by database configuration

## Project Structure

```
src/
├── application/          # Express setup, config loader, entry point
├── constant/             # Enums and constants (APPROVAL_STRATEGIES, EXPENSE_STATUS, etc.)
├── controller/           # HTTP request handlers
├── service/              # Business logic (to be implemented)
├── serviceHelper/        # Core utilities (workflowExecutor, auditHelper)
├── dataAccessor/mysql/   # Sequelize models and database initialization
├── exception/            # Custom error classes
├── logger/               # Winston logger configuration
├── middleware/           # Express middleware (error handling, CORS, etc.)
├── models/               # Response models
├── builder/              # Response builders
├── route/                # API routes
└── utils/                # Helper utilities

tests/
├── src/service/          # Service unit tests
├── src/serviceHelper/    # Core logic tests
└── src/controller/       # Controller tests

config/
└── expense-management-svc/
    ├── local/            # Development configuration
    ├── test/             # Testing configuration
    └── production/       # Production configuration
```

## Database Models (14 Tables)

| Model | Purpose |
|-------|---------|
| Organization | Multi-tenant isolation |
| Department | Organizational departments |
| Role | Role definitions with approval levels |
| User | Employees/users with manager hierarchy |
| UserRole | Many-to-many user-role mapping |
| ExpenseType | Expense categories and limits |
| ApprovalWorkflow | Workflow strategy and settings |
| ApprovalStep | Sequential approval steps |
| CustomApprovalFlow | Admin-defined custom flows |
| CustomApprovalFlowStep | Steps in custom flows |
| Expense | Expense records |
| ExpenseApproval | Approval history |
| AuditLog | Full audit trail |

## Approval Strategies

### HIERARCHY
- Walks the manager_id chain upward
- Finds first manager with required approval_level
- Used for organizational pyramid approvals

### ROLE_BASED
- Queries all users with required_role_id
- Excludes the submitter
- Useful for approval by any member of a department

### CUSTOM
- Admin-defined sequence of steps
- Can skip steps from the standard workflow
- Example: Steps 1, 3, 4 (skipping 2)

## Configuration

Configurations are loaded per environment from `config/expense-management-svc/{env}/`:

- `application.env` - Environment variables (NODE_ENV, PORT, etc.)
- `expense-management-svc.json` - Service config (database connection, features, etc.)

Set `CONFIG_FILE` environment variable to point to config directory.

## Getting Started

### Prerequisites
- Node.js 14+
- MySQL 5.7+ (or Docker)
- npm 6+

### Installation

```bash
npm install
```

### Database Setup (Quick - 5 minutes)

See [QUICK_START_DB.md](./QUICK_START_DB.md) for the fastest way to set up MySQL with sample data.

**Docker Method (Easiest):**
```bash
# Create and load database
docker run --name expense_db \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=expense_mgmt_local \
  -p 3306:3306 \
  -d mysql:8.0

sleep 20
docker exec -i expense_db mysql -u root -psecret < database.sql
```

**Or with existing MySQL:**
```bash
mysql -u root -p < database.sql
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for more options and configuration.

### Development

```bash
npm run dev
```

Server starts on port 3000 (or `NODE_SVC_PORT` from config).

Visit `http://localhost:3000/ping` → `{"message":"pong"}`

### Testing

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Production

```bash
npm start
```

## API Endpoints

### Health Check
```
GET /ping
```

### Admin APIs (to be implemented)
- POST /api/admin/organizations
- POST /api/admin/organizations/:orgId/expense-types
- POST /api/admin/organizations/:orgId/roles
- POST /api/admin/organizations/:orgId/users
- POST /api/admin/organizations/:orgId/approval-workflows
- POST /api/admin/organizations/:orgId/approval-workflows/:workflowId/steps
- POST /api/admin/organizations/:orgId/approval-workflows/:workflowId/custom-flows

### Expense APIs (to be implemented)
- POST /api/organizations/:orgId/expenses
- GET /api/organizations/:orgId/expenses
- GET /api/organizations/:orgId/expenses/:expenseId
- PUT /api/organizations/:orgId/expenses/:expenseId
- POST /api/organizations/:orgId/expenses/:expenseId/submit

### Approval APIs (to be implemented)
- GET /api/users/:userId/pending-approvals
- POST /api/organizations/:orgId/expenses/:expenseId/approve
- POST /api/organizations/:orgId/expenses/:expenseId/reject
- POST /api/organizations/:orgId/expenses/:expenseId/request-modification
- GET /api/organizations/:orgId/expenses/:expenseId/audit-log

## Core Components

### WorkflowExecutor (src/serviceHelper/workflowExecutor.js)
Central engine for approval routing. Handles all three strategies and finds the next approver in a workflow.

### AppConfigLoader (src/application/appConfigLoader.js)
Loads environment-specific configuration following the publisher-svc pattern.

### Logger (src/logger/logger.js)
Winston-based logging to console and files (error.log, combined.log, exceptions.log).

## Logging

Logs are written to the `logs/` directory:
- `error.log` - Error-level messages only
- `combined.log` - All messages
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## Next Steps

1. Implement service layer (`src/service/*.js`)
2. Implement controllers (`src/controller/*.js`)
3. Implement route handlers (`src/route/**/*.js`)
4. Write comprehensive tests
5. Add validation middleware and Joi schemas
6. Add notification/email service
7. Deploy to production

## References

- Project modeled after `publisher-svc` structure
- Database: MySQL with Sequelize ORM
- HTTP Framework: Express.js
- Testing: Jest
