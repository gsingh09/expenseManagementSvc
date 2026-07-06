# Expense Management Service - System Design Document

**Version**: 1.0
**Date**: July 6, 2026
**Environment**: Production-Ready Node.js/Express with MySQL

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Functional Requirements](#functional-requirements)
3. [Non-Functional Requirements](#non-functional-requirements)
4. [System Architecture](#system-architecture)
5. [Data Models](#data-models)
6. [API Design](#api-design)
7. [Approval Workflow Engine](#approval-workflow-engine)
8. [Role & Permission Model](#role--permission-model)
9. [Security Considerations](#security-considerations)
10. [Scalability Strategy](#scalability-strategy)
11. [Failure Handling & Resilience](#failure-handling--resilience)
12. [Audit Mechanisms](#audit-mechanisms)
13. [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

The **Expense Management Service** is a multi-tenant SaaS platform enabling organizations to submit, review, and approve expenses with configurable multi-level approval workflows. The system supports three approval strategies (Hierarchical, Role-Based, and Custom), audit logging, and is designed for high-availability, scalability, and security.

**Key Features**:
- Multi-tenant organizational isolation
- Configurable multi-step approval workflows
- Three approval strategies (HIERARCHY, ROLE_BASED, CUSTOM)
- Complete audit trail for compliance
- Role-based access control
- Real-time logging with request correlation

---

## Functional Requirements

### FR1: Expense Management
- **FR1.1**: Users can create expense drafts with details (type, amount, description)
- **FR1.2**: Users can submit expenses for approval
- **FR1.3**: Users can view their submitted expenses and their status
- **FR1.4**: Expenses cannot exceed organization-defined limits per type
- **FR1.5**: Users can modify draft expenses before submission

### FR2: Approval Workflows
- **FR2.1**: Admin can create approval workflows per organization
- **FR2.2**: Admin can define workflow strategy (HIERARCHY, ROLE_BASED, CUSTOM)
- **FR2.3**: Admin can add multiple approval steps to a workflow
- **FR2.4**: Workflows are linked to expense types
- **FR2.5**: Multiple steps can be added in a single API request

### FR3: Approval Process
- **FR3.1**: Approvers can view pending expenses awaiting their approval
- **FR3.2**: Approvers can approve expenses
- **FR3.3**: Approvers can reject expenses with reason
- **FR3.4**: Approvers can request modifications from submitters
- **FR3.5**: System automatically determines next approver based on workflow strategy
- **FR3.6**: Expense is approved when all approval steps pass

### FR4: Organization & User Management
- **FR4.1**: Admins can create organizations
- **FR4.2**: Admins can manage users within organization
- **FR4.3**: Admins can set manager-employee relationships (hierarchy)
- **FR4.4**: Admins can assign roles to users
- **FR4.5**: Admins can create organization-specific roles
- **FR4.6**: Admins can create expense types per organization

### FR5: Audit & Compliance
- **FR5.1**: All expense mutations are logged with timestamp, user, action, change details
- **FR5.2**: All approval actions are logged
- **FR5.3**: Full approval history is retrievable per expense
- **FR5.4**: Audit logs include IP, requestId for tracking
- **FR5.5**: Sensitive data is never stored in logs

---

## Non-Functional Requirements

### NFR1: Performance
- **NFR1.1**: API response time < 200ms for 95th percentile
- **NFR1.2**: Support 10K concurrent users
- **NFR1.3**: Database queries optimized with proper indexing
- **NFR1.4**: Implement caching for frequently accessed data

### NFR2: Availability
- **NFR2.1**: 99.5% uptime SLA
- **NFR2.2**: Automatic failover for database connections
- **NFR2.3**: Graceful degradation under high load
- **NFR2.4**: Health check endpoints for monitoring

### NFR3: Scalability
- **NFR3.1**: Horizontal scaling via stateless service design
- **NFR3.2**: Database sharding strategy for 1M+ records
- **NFR3.3**: Message queue for async operations (future)
- **NFR3.4**: Load balancing across multiple instances

### NFR4: Security
- **NFR4.1**: All data encrypted at rest (AES-256)
- **NFR4.2**: TLS 1.3 for all API communications
- **NFR4.3**: API authentication via JWT tokens
- **NFR4.4**: Rate limiting (100 req/min per user)
- **NFR4.5**: SQL injection prevention via parameterized queries
- **NFR4.6**: XSS prevention via input validation

### NFR5: Maintainability
- **NFR5.1**: 70% code coverage with unit & integration tests
- **NFR5.2**: Comprehensive API documentation
- **NFR5.3**: Centralized logging with request correlation
- **NFR5.4**: Environment-specific configuration

### NFR6: Monitoring & Logging
- **NFR6.1**: Request/response logging with requestId
- **NFR6.2**: Environment-based log levels (production=warn, dev=debug)
- **NFR6.3**: Error metrics exported to monitoring systems
- **NFR6.4**: Alert on error rates > 1%

---

## System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    Client["Client Application<br/>(Web/Mobile)"]
    LB["Load Balancer<br/>(HAProxy/Nginx)"]

    subgraph API["API Services (Stateless)"]
        API1["Express Server 1"]
        API2["Express Server 2"]
        API3["Express Server N"]
    end

    Cache["Redis Cache<br/>(Session/Data)"]
    DB["MySQL Cluster<br/>(Primary + Replicas)"]

    subgraph Logging["Observability"]
        Logs["ELK Stack<br/>(Logging)"]
        Metrics["Prometheus<br/>(Metrics)"]
        Monitoring["Grafana<br/>(Dashboards)"]
    end

    MQ["Message Queue<br/>(RabbitMQ/Kafka)"]

    Client -->|HTTPS| LB
    LB -->|Routes| API1
    LB -->|Routes| API2
    LB -->|Routes| API3

    API1 -->|Read/Write| Cache
    API2 -->|Read/Write| Cache
    API3 -->|Read/Write| Cache

    API1 -->|Query| DB
    API2 -->|Query| DB
    API3 -->|Query| DB

    API1 -->|Logs| Logs
    API2 -->|Logs| Logs
    API3 -->|Logs| Logs

    API1 -->|Metrics| Metrics
    API2 -->|Metrics| Metrics
    API3 -->|Metrics| Metrics

    Metrics -->|Visualize| Monitoring

    API1 -->|Async Tasks| MQ
    API2 -->|Async Tasks| MQ
    API3 -->|Async Tasks| MQ
```

### Service Layer Architecture

```mermaid
graph LR
    Route["Route Handlers"]
    Controller["Controllers<br/>(HTTP)"]
    Service["Services<br/>(Business Logic)"]
    Helper["Service Helpers<br/>(Utilities)"]
    DataAccess["Data Access<br/>(Sequelize ORM)"]
    DB["MySQL Database"]

    Route -->|Calls| Controller
    Controller -->|Uses| Service
    Service -->|Uses| Helper
    Service -->|Queries| DataAccess
    DataAccess -->|SQL| DB

    style Controller fill:#e1f5ff
    style Service fill:#fff3e0
    style Helper fill:#f3e5f5
    style DataAccess fill:#e8f5e9
```

---

## Data Models

### Entity Relationship Diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ DEPARTMENT : contains
    ORGANIZATION ||--o{ USER : has
    ORGANIZATION ||--o{ ROLE : defines
    ORGANIZATION ||--o{ EXPENSE_TYPE : defines
    ORGANIZATION ||--o{ APPROVAL_WORKFLOW : defines

    USER ||--o{ USER : manages
    USER ||--o{ USER_ROLE : assigns
    USER ||--o{ EXPENSE : submits
    USER ||--o{ EXPENSE_APPROVAL : approves

    ROLE ||--o{ USER_ROLE : assigned_to
    ROLE ||--o{ APPROVAL_STEP : requires

    EXPENSE_TYPE ||--o{ EXPENSE : categorized_as
    EXPENSE_TYPE ||--o{ APPROVAL_WORKFLOW : triggers

    APPROVAL_WORKFLOW ||--o{ APPROVAL_STEP : contains
    APPROVAL_WORKFLOW ||--o{ CUSTOM_APPROVAL_FLOW : uses

    APPROVAL_STEP ||--o{ EXPENSE_APPROVAL : evaluates

    CUSTOM_APPROVAL_FLOW ||--o{ CUSTOM_APPROVAL_FLOW_STEP : contains

    EXPENSE ||--o{ EXPENSE_APPROVAL : receives
    EXPENSE ||--o{ AUDIT_LOG : logs

    DEPARTMENT ||--o{ USER : contains
```

### Core Data Models

```javascript
// Organization
{
  id: uuid,
  name: string (unique),
  slug: string (unique),
  createdAt: timestamp,
  updatedAt: timestamp
}

// User
{
  id: uuid,
  org_id: uuid (FK),
  email: string (unique per org),
  first_name: string,
  last_name: string,
  dept_id: uuid (FK),
  manager_id: uuid (FK) - Self-reference for hierarchy,
  createdAt: timestamp,
  updatedAt: timestamp
}

// Role (Approval Levels: 0-4)
{
  id: uuid,
  org_id: uuid (FK),
  name: string,
  approval_level: enum(0,1,2,3,4),
  createdAt: timestamp,
  updatedAt: timestamp
}

// ExpenseType
{
  id: uuid,
  org_id: uuid (FK),
  name: string,
  max_amount: decimal(10,2),
  description: text,
  createdAt: timestamp,
  updatedAt: timestamp
}

// ApprovalWorkflow
{
  id: uuid,
  org_id: uuid (FK),
  expense_type_id: uuid (FK),
  strategy: enum('HIERARCHY', 'ROLE_BASED', 'CUSTOM'),
  name: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

// ApprovalStep
{
  id: uuid,
  workflow_id: uuid (FK),
  step_order: integer,
  required_approval_level: integer (nullable),
  required_role_id: uuid (nullable, FK),
  createdAt: timestamp,
  updatedAt: timestamp
}

// Expense
{
  id: uuid,
  org_id: uuid (FK),
  submitter_id: uuid (FK to User),
  expense_type_id: uuid (FK),
  workflow_id: uuid (FK),
  amount: decimal(10,2),
  description: text,
  status: enum('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'),
  current_approval_step: integer,
  created_at: timestamp,
  updated_at: timestamp
}

// ExpenseApproval
{
  id: uuid,
  expense_id: uuid (FK),
  approver_id: uuid (FK to User),
  step_number: integer,
  action: enum('APPROVED', 'REJECTED', 'REQUESTED_MODIFICATION'),
  comments: text,
  created_at: timestamp
}

// AuditLog
{
  id: uuid,
  entity_type: string,
  entity_id: uuid,
  action: enum('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'),
  actor_id: uuid (FK to User),
  changes: json,
  ip_address: string,
  request_id: string,
  created_at: timestamp
}
```

---

## API Design

### API Endpoints Overview

```mermaid
graph TB
    subgraph Admin["Admin APIs"]
        A1["POST /api/admin/organizations"]
        A2["GET /api/admin/organizations"]
        A3["POST /api/admin/organizations/{orgId}/users"]
        A4["POST /api/admin/organizations/{orgId}/roles"]
        A5["POST /api/admin/organizations/{orgId}/expense-types"]
        A6["POST /api/admin/organizations/{orgId}/workflows"]
        A7["POST /api/admin/organizations/{orgId}/workflows/{wfId}/steps"]
    end

    subgraph Expense["Expense APIs"]
        E1["POST /api/organizations/{orgId}/expenses"]
        E2["GET /api/organizations/{orgId}/expenses"]
        E3["POST /api/organizations/{orgId}/expenses/{expId}/submit"]
    end

    subgraph Approval["Approval APIs"]
        AP1["GET /api/users/{userId}/pending-approvals"]
        AP2["POST /api/users/{userId}/expenses/{expId}/approve"]
        AP3["POST /api/users/{userId}/expenses/{expId}/reject"]
        AP4["POST /api/users/{userId}/expenses/{expId}/request-modification"]
        AP5["GET /api/users/{userId}/expenses/{expId}/approvals"]
    end

    style Admin fill:#c8e6c9
    style Expense fill:#bbdefb
    style Approval fill:#ffe0b2
```

### Sample API Request/Response

#### Create Expense Type
```http
POST /api/admin/organizations/1/expense-types
Content-Type: application/json
X-Request-Id: 1783284300180-4p25uggd3

Request:
{
  "name": "Travel",
  "maxAmount": 5000.00,
  "description": "Flight, hotel, transportation"
}

Response:
{
  "success": true,
  "requestId": "1783284300180-4p25uggd3",
  "data": {
    "id": 1,
    "org_id": 1,
    "name": "Travel",
    "max_amount": "5000.00",
    "description": "Flight, hotel, transportation",
    "createdAt": "2026-07-06T02:15:00.000Z",
    "updatedAt": "2026-07-06T02:15:00.000Z"
  }
}
```

#### Create Workflow with Multiple Steps
```http
POST /api/admin/organizations/1/workflows/1/steps
Content-Type: application/json
X-Request-Id: 1783284300180-4p25uggd3

Request:
{
  "steps": [
    {
      "stepOrder": 1,
      "requiredApprovalLevel": 1,
      "requiredRoleId": null
    },
    {
      "stepOrder": 2,
      "requiredApprovalLevel": 2,
      "requiredRoleId": null
    },
    {
      "stepOrder": 3,
      "requiredApprovalLevel": 3,
      "requiredRoleId": null
    }
  ]
}

Response:
{
  "success": true,
  "requestId": "1783284300180-4p25uggd3",
  "data": [
    {
      "id": 1,
      "workflow_id": 1,
      "step_order": 1,
      "required_approval_level": 1,
      "required_role_id": null,
      "createdAt": "2026-07-06T02:15:00.000Z",
      "updatedAt": "2026-07-06T02:15:00.000Z"
    },
    ...
  ]
}
```

#### Submit Expense for Approval
```http
POST /api/organizations/1/expenses/1/submit
Content-Type: application/json
X-Request-Id: 1783284300180-4p25uggd3

Request:
{
  "submitterId": 1
}

Response:
{
  "success": true,
  "requestId": "1783284300180-4p25uggd3",
  "data": {
    "id": 1,
    "org_id": 1,
    "submitter_id": 1,
    "expense_type_id": 1,
    "workflow_id": 1,
    "amount": "2500.00",
    "status": "SUBMITTED",
    "current_approval_step": 1,
    "createdAt": "2026-07-06T02:15:00.000Z",
    "updatedAt": "2026-07-06T02:15:00.000Z"
  }
}
```

---

## Approval Workflow Engine

### Workflow Engine Architecture

```mermaid
graph TD
    Expense["Expense Submitted<br/>Status: DRAFT → SUBMITTED"]
    GetWorkflow["Fetch Workflow<br/>(from ExpenseType)"]
    GetStep["Get Current Step<br/>(step_order)"]

    subgraph StrategyEngine["Strategy Selector"]
        HIERARCHY["HIERARCHY Strategy<br/>Walk manager chain"]
        ROLE_BASED["ROLE_BASED Strategy<br/>Find users with role"]
        CUSTOM["CUSTOM Strategy<br/>Lookup custom flow"]
    end

    GetApprover["Determine Next Approver<br/>(based on strategy)"]
    CreateApprovalRecord["Create ExpenseApproval<br/>Assign to approver"]
    Notify["Notify Approver"]

    Expense --> GetWorkflow
    GetWorkflow --> GetStep
    GetStep --> StrategyEngine
    StrategyEngine --> GetApprover
    GetApprover --> CreateApprovalRecord
    CreateApprovalRecord --> Notify
```

### HIERARCHY Strategy Flow

```mermaid
graph TD
    Start["Start: Get Approver<br/>for Approval Level X"]
    GetUser["Get Current User<br/>(expense submitter)"]
    GetManager["Get User's Manager"]

    Decision{"Manager's<br/>Approval Level<br/>≥ Required Level?"}

    Found["✓ Approver Found<br/>Assign to manager"]

    CheckNext{"Manager has<br/>a manager?"}

    NotFound["✗ No Approver Found<br/>(escalate to admin)"]

    CircularCheck{"Circular Reference<br/>Detected?"}

    Start --> GetUser
    GetUser --> GetManager
    GetManager --> Decision
    Decision -->|Yes| Found
    Decision -->|No| CheckNext
    CheckNext -->|Yes| CircularCheck
    CircularCheck -->|Yes| NotFound
    CircularCheck -->|No| GetManager
    CheckNext -->|No| NotFound
```

### ROLE_BASED Strategy Flow

```mermaid
graph TD
    Start["Start: Get Approver<br/>for Role X"]
    Query["Query: Find all users<br/>with required role"]

    Filter["Filter: Exclude submitter<br/>(same organization)"]

    Result{"Found<br/>Users?"}

    Multiple["Multiple Approvers<br/>Return all<br/>(parallel approval)"]

    Single["Single Approver<br/>Assign to user"]

    None["No Approvers<br/>(escalate)"]

    Start --> Query
    Query --> Filter
    Filter --> Result
    Result -->|Yes| Multiple
    Multiple -->|If 1 user| Single
    Result -->|No| None
```

### CUSTOM Strategy Flow

```mermaid
graph TD
    Start["Start: Lookup Custom Flow<br/>for Workflow"]

    GetCustomSteps["Get CustomApprovalFlowStep<br/>for current step_number"]

    CheckType{"Step Type?"}

    Hierarchy["HIERARCHY<br/>Use HIERARCHY strategy"]
    RoleBased["ROLE_BASED<br/>Use ROLE_BASED strategy"]

    Hierarchy --> GetApprover["Determine Approver"]
    RoleBased --> GetApprover

    GetApprover --> Assign["Assign Approver<br/>Create ExpenseApproval"]

    Start --> GetCustomSteps
    GetCustomSteps --> CheckType
```

### Approval Step Progression

```mermaid
stateDiagram-v2
    [*] --> DRAFT

    DRAFT --> SUBMITTED: submit_expense()

    SUBMITTED --> APPROVED: All steps approved
    SUBMITTED --> REJECTED: Any step rejected
    SUBMITTED --> REQUESTING_MOD: Any step requests modification

    REQUESTING_MOD --> SUBMITTED: User resubmits

    APPROVED --> [*]
    REJECTED --> [*]

    note right of SUBMITTED
        Current step tracks
        which approval level
        we're waiting for
    end note
```

---

## Role & Permission Model

### Role Hierarchy

```mermaid
graph TD
    A["Approval Level 4<br/>Finance Lead<br/>(CFO)"]
    B["Approval Level 3<br/>Director<br/>(VP Finance)"]
    C["Approval Level 2<br/>Senior Manager<br/>(Finance Manager)"]
    D["Approval Level 1<br/>Manager<br/>(Team Lead)"]
    E["Approval Level 0<br/>Employee<br/>(Individual Contributor)"]

    E -->|Reports to| D
    D -->|Reports to| C
    C -->|Reports to| B
    B -->|Reports to| A

    style A fill:#c8e6c9
    style B fill:#bbdefb
    style C fill:#ffe0b2
    style D fill:#f8bbd0
    style E fill:#e1bee7
```

### Permission Matrix

| Role | Create Expense | Submit Expense | Approve L1-2 | Approve L3-4 | Manage Workflows | View Audit |
|------|---|---|---|---|---|---|
| **Employee (L0)** | ✓ | ✓ | ✗ | ✗ | ✗ | ✓* |
| **Manager (L1)** | ✓ | ✓ | ✓ | ✗ | ✗ | ✓* |
| **Senior Mgr (L2)** | ✓ | ✓ | ✓ | ✓ | ✗ | ✓* |
| **Director (L3)** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Finance Lead (L4)** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

*Can only view own expenses and their approval chain

### Access Control Flow

```mermaid
graph TD
    Request["Incoming Request"]
    Auth["Extract User from JWT<br/>(or session)"]
    GetRole["Get User's Role(s)"]
    GetPermission["Map Role to Permissions"]

    Decision{"Has Required<br/>Permission?"}

    Allow["✓ Allow Request<br/>Continue to handler"]
    Deny["✗ Deny Request<br/>Return 403 Forbidden"]

    Audit["Log Action to AuditLog<br/>(with requestId)"]

    Request --> Auth
    Auth --> GetRole
    GetRole --> GetPermission
    GetPermission --> Decision
    Decision -->|Yes| Audit
    Audit --> Allow
    Decision -->|No| Deny

    style Allow fill:#c8e6c9
    style Deny fill:#ffcdd2
```

---

## Security Considerations

### Security Architecture

```mermaid
graph TB
    Client["Client Application"]

    subgraph Network["Network Security"]
        TLS["TLS 1.3 Encryption<br/>(HTTPS only)"]
        WAF["Web Application Firewall<br/>(ModSecurity)"]
        RateLimit["Rate Limiting<br/>(100 req/min per user)"]
    end

    subgraph Auth["Authentication & Authorization"]
        JWT["JWT Token Validation<br/>(HS256)"]
        RBAC["Role-Based Access Control<br/>(RBAC)"]
        OrgIsolation["Organization Isolation<br/>(Multi-tenant)"]
    end

    subgraph DataSecurity["Data Security"]
        Encryption["AES-256 Encryption<br/>(at rest)"]
        Hashing["Bcrypt Password Hashing<br/>(cost=12)"]
        Validation["Input Validation<br/>(Joi schemas)"]
        SQLInjection["SQL Injection Prevention<br/>(Parameterized queries)"]
    end

    subgraph Audit["Audit & Monitoring"]
        Logging["Comprehensive Logging<br/>(requestId tracking)"]
        SensitiveData["Sensitive Data Redaction<br/>(passwords, tokens)"]
        Alerts["Real-time Alerting<br/>(error > 1%)"]
    end

    Client -->|HTTPS| Network
    Network -->|Authorized| Auth
    Auth -->|Verified| DataSecurity
    DataSecurity -->|Logged| Audit
```

### Authentication Flow

```mermaid
sequenceDiagram
    Client->>API: POST /login with credentials
    API->>DB: Verify username & password (bcrypt)
    DB->>API: User found & password matches
    API->>API: Generate JWT (HS256, 24h expiry)
    API->>Client: Return JWT token

    Client->>API: GET /api/expenses (with JWT in header)
    API->>API: Validate JWT signature & expiry
    API->>API: Extract userId from JWT
    API->>DB: Load user & permissions
    DB->>API: Return user data
    API->>API: Check organization isolation
    API->>Client: Return response (if authorized)
```

### Data Protection Measures

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **Network** | TLS 1.3 | All traffic encrypted in transit |
| **At Rest** | AES-256 | Database encryption for sensitive fields |
| **Passwords** | Bcrypt | cost=12, salt rounds for slow hashing |
| **Input** | Joi Validation | Whitelist validation, no dynamic SQL |
| **Query** | Parameterized Queries | Bind variables prevent SQL injection |
| **Logging** | Redaction | Strip passwords, tokens, API keys |
| **Session** | JWT Tokens | Stateless, short-lived, RS256 signing |

---

## Scalability Strategy

### Horizontal Scaling Architecture

```mermaid
graph TB
    Users["Thousands of Users"]

    subgraph LB["Load Balancing"]
        Nginx["Nginx/HAProxy<br/>(Session Affinity)"]
    end

    subgraph AppServers["Application Servers<br/>(Stateless)"]
        S1["Instance 1"]
        S2["Instance 2"]
        S3["Instance 3"]
        SN["Instance N"]
    end

    subgraph Caching["Caching Layer"]
        Redis["Redis Cluster<br/>(Session + Data)"]
    end

    subgraph Database["Database Cluster"]
        Primary["Primary DB<br/>(Write)"]
        Replica1["Read Replica 1"]
        Replica2["Read Replica 2"]
        ReplicaN["Read Replica N"]
    end

    Users -->|HTTP/HTTPS| Nginx
    Nginx -->|Route| S1
    Nginx -->|Route| S2
    Nginx -->|Route| S3
    Nginx -->|Route| SN

    S1 -->|Cache| Redis
    S2 -->|Cache| Redis
    S3 -->|Cache| Redis
    SN -->|Cache| Redis

    S1 -->|Write| Primary
    S2 -->|Read| Replica1
    S3 -->|Read| Replica2
    SN -->|Read| ReplicaN

    Primary -->|Replicate| Replica1
    Primary -->|Replicate| Replica2
    Primary -->|Replicate| ReplicaN

    style Nginx fill:#e1f5ff
    style Redis fill:#fff3e0
    style Primary fill:#f3e5f5
```

### Database Optimization

| Strategy | Implementation | Benefits |
|----------|---|---|
| **Indexing** | B-tree indexes on FK, status, org_id | Query performance < 50ms |
| **Partitioning** | By org_id for audit logs | Handle 1M+ records |
| **Connection Pooling** | min=10, max=50 connections | Efficient resource usage |
| **Read Replicas** | 3x read replicas for analytics | Scale read operations |
| **Caching** | Redis for sessions & frequently queried data | 10x performance boost |
| **Query Optimization** | Explain plans, N+1 prevention | Efficient SQL execution |

### Scaling Metrics

```mermaid
graph LR
    A["0-100 Users<br/>Single Instance<br/>Single DB"] -->
    B["100-1K Users<br/>2-3 Instances<br/>1 Primary + 1 Replica"]

    B -->
    C["1K-10K Users<br/>5-10 Instances<br/>1 Primary + 3 Replicas"]

    C -->
    D["10K+ Users<br/>20+ Instances<br/>Multiple Shards"]

    style A fill:#c8e6c9
    style B fill:#bbdefb
    style C fill:#ffe0b2
    style D fill:#f8bbd0
```

---

## Failure Handling & Resilience

### Fault Tolerance Strategy

```mermaid
graph TD
    Request["Incoming Request"]

    subgraph CircuitBreaker["Circuit Breaker Pattern"]
        CB["Monitor Failure Rate"]
        CB -->|< 50% failures| Pass["CLOSED: Pass through"]
        CB -->|> 50% failures| Fail["OPEN: Return cached response"]
        CB -->|Timeout| Half["HALF_OPEN: Try recovery"]
    end

    subgraph Retry["Retry Logic"]
        R["Retry up to 3 times<br/>with exponential backoff"]
    end

    subgraph Fallback["Fallback Strategy"]
        FB["Return cached data<br/>or error response"]
    end

    Request --> CircuitBreaker
    Pass --> Retry
    Retry -->|Success| Return["Return Response"]
    Retry -->|Failure| Fallback
    Fail --> Fallback
    Fallback --> Return
    Half -->|Success| Pass
    Half -->|Failure| Fail

    style Return fill:#c8e6c9
```

### Error Handling & Recovery

| Scenario | Handling | Recovery |
|----------|----------|----------|
| **DB Connection Lost** | Return 503 Service Unavailable | Retry with exponential backoff |
| **Slow Query** | Query timeout after 5s | Log query, alert team |
| **Out of Memory** | Graceful shutdown | Trigger auto-scaling |
| **Rate Limit Exceeded** | Return 429 Too Many Requests | Queue request for later |
| **Invalid Data** | Return 400 Bad Request | Log validation error |
| **Unauthorized Access** | Return 403 Forbidden | Log security event |

### Health Check Mechanism

```javascript
GET /health
Response: {
  status: "healthy|degraded|unhealthy",
  checks: {
    database: {
      status: "ok|error",
      latency: "12ms",
      timestamp: "2026-07-06T02:15:00Z"
    },
    cache: {
      status: "ok|error",
      latency: "2ms",
      timestamp: "2026-07-06T02:15:00Z"
    },
    disk: {
      status: "ok|error",
      usage: "45%",
      timestamp: "2026-07-06T02:15:00Z"
    }
  },
  uptime: "720h",
  version: "1.0.0"
}
```

---

## Audit Mechanisms

### Audit Logging Architecture

```mermaid
graph TD
    Action["User Action<br/>(Create/Update/Delete/Approve)"]

    CaptureContext["Capture Context"]
    CaptureContext --> AC1["User ID"]
    CaptureContext --> AC2["Request ID"]
    CaptureContext --> AC3["IP Address"]
    CaptureContext --> AC4["Timestamp"]

    CaptureChanges["Capture Changes"]
    CaptureChanges --> CC1["Old Values"]
    CaptureChanges --> CC2["New Values"]
    CaptureChanges --> CC3["Diff"]

    CreateAuditLog["Create AuditLog Record"]

    StoreInDB["Store in Database<br/>(audit_logs table)"]

    RedactSensitive["Redact Sensitive Data"]

    LogToFile["Log to File<br/>(error.log if error)"]

    Action --> CaptureContext
    Action --> CaptureChanges
    CaptureContext --> CreateAuditLog
    CaptureChanges --> CreateAuditLog
    CreateAuditLog --> StoreInDB
    CreateAuditLog --> RedactSensitive
    RedactSensitive --> LogToFile
```

### Audit Log Entry Example

```json
{
  "id": "audit-001",
  "entity_type": "expense",
  "entity_id": "exp-123",
  "action": "APPROVED",
  "actor_id": "user-456",
  "actor_name": "John Manager",
  "organization_id": "org-789",
  "ip_address": "192.168.1.1",
  "request_id": "1783284300180-4p25uggd3",
  "timestamp": "2026-07-06T02:15:00.000Z",
  "changes": {
    "status": {
      "old": "SUBMITTED",
      "new": "APPROVED"
    },
    "current_approval_step": {
      "old": 1,
      "new": 2
    },
    "approved_by": {
      "old": null,
      "new": "user-456"
    }
  },
  "context": {
    "method": "POST",
    "url": "/api/users/456/expenses/123/approve",
    "user_agent": "Mozilla/5.0..."
  }
}
```

### Audit Trail Retrieval

```http
GET /api/expenses/123/audit-log
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "requestId": "1783284300180-4p25uggd3",
  "data": [
    {
      "id": "audit-001",
      "timestamp": "2026-07-06T02:00:00.000Z",
      "action": "CREATE",
      "actor": "user-1",
      "description": "Expense created for $2500"
    },
    {
      "id": "audit-002",
      "timestamp": "2026-07-06T02:05:00.000Z",
      "action": "SUBMITTED",
      "actor": "user-1",
      "description": "Expense submitted for approval"
    },
    {
      "id": "audit-003",
      "timestamp": "2026-07-06T02:15:00.000Z",
      "action": "APPROVED",
      "actor": "user-2",
      "description": "Approved at step 1 (Manager level)"
    }
  ]
}
```

---

## Deployment Architecture

### Deployment Pipeline

```mermaid
graph LR
    Code["Code Commit<br/>GitHub"]

    CI["CI Pipeline<br/>(GitHub Actions)"]
    CI --> Build["Build & Test<br/>- npm test<br/>- ESLint<br/>- Coverage > 70%"]

    Artifact["Build Artifact<br/>(Docker Image)"]

    Registry["Container Registry<br/>(Docker Hub/ECR)"]

    Deploy["Deployment<br/>(Kubernetes)"]

    Staging["Staging Environment<br/>- Integration Tests<br/>- Smoke Tests"]

    Production["Production Environment<br/>- Health Checks<br/>- Canary Deploy"]

    Code -->|Trigger| CI
    CI -->|Success| Artifact
    Artifact -->|Push| Registry
    Registry -->|Pull| Deploy
    Deploy -->|Run| Staging
    Staging -->|Approve| Production

    style Code fill:#c8e6c9
    style CI fill:#bbdefb
    style Production fill:#ffe0b2
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: expense-management-svc
spec:
  replicas: 3
  selector:
    matchLabels:
      app: expense-management-svc
  template:
    metadata:
      labels:
        app: expense-management-svc
    spec:
      containers:
      - name: api
        image: expense-management-svc:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

---

## Assumptions & Constraints

### Assumptions
1. **JWT-based authentication** is implemented at the API gateway level
2. **Single MySQL database** serves all organizations (multi-tenant with org_id isolation)
3. **Manager hierarchy** is manually maintained (no auto-calculation)
4. **Synchronous approval flow** (no message queue currently, can be added for scale)
5. **Stateless API services** for horizontal scalability
6. **Redis cache** available for session storage
7. **Email notifications** can be added (currently out of scope)

### Constraints
1. **No real-time websockets** (long polling or scheduled checks for updates)
2. **No offline mode** (always requires network connectivity)
3. **Max 1M+ records** before sharding needed (current DB design)
4. **Approval timeout**: No auto-approval after X days (manual escalation)
5. **Concurrent modifications**: Last-write-wins strategy for optimistic locking

### Future Enhancements
1. **Message queue** for async approval notifications
2. **Email/SMS notifications** on expense status changes
3. **Mobile app** with biometric authentication
4. **Approval delegation** to temporary approvers
5. **Budget tracking** and forecasting
6. **Integration with accounting systems** (Quickbooks, SAP)
7. **Multi-currency support**
8. **Receipt OCR** and attachment handling
9. **Analytics & dashboards** for expense trends
10. **Custom approval rules** (amount-based routing)

---

## Summary

This **Expense Management Service** is a production-ready, scalable platform designed to handle complex multi-level approval workflows in a secure, multi-tenant environment. The system prioritizes:

- **Security**: Encryption, authentication, audit trails
- **Scalability**: Horizontal scaling, caching, optimization
- **Reliability**: Error handling, health checks, monitoring
- **Auditability**: Complete audit trail with request correlation
- **Maintainability**: Clean architecture, comprehensive logging, documentation

The implementation uses industry-standard patterns and technologies (Express.js, Sequelize, MySQL, Redis) and is ready for production deployment.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-07-06 | System Design Team | Initial system design |

