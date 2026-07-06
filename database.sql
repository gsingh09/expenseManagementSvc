-- Expense Management System Database Schema
-- MySQL 5.7+ Compatible
-- Creates all tables with sample data for testing

-- =====================================================
-- DATABASE SETUP
-- =====================================================

CREATE DATABASE IF NOT EXISTS expense_mgmt_local;
USE expense_mgmt_local;

-- =====================================================
-- TABLES
-- =====================================================

-- Organizations (Multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_dept_id INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_dept_id) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_org_id (org_id),
  UNIQUE KEY unique_org_dept (org_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles (with approval levels)
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  approval_level INT NOT NULL COMMENT '0=EMPLOYEE, 1=MANAGER, 2=SR_MANAGER, 3=DIRECTOR, 4=CLEVEL_FINANCE',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_org_id (org_id),
  UNIQUE KEY unique_org_role (org_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users (with manager hierarchy via self-reference)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  dept_id INT NULL,
  manager_id INT NULL COMMENT 'Self-reference for hierarchical organization',
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_org_id (org_id),
  INDEX idx_manager_id (manager_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Roles (Junction table for many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role_id),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense Types (per organization)
CREATE TABLE IF NOT EXISTS expense_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  max_amount DECIMAL(15, 2) NULL,
  description TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_org_id (org_id),
  UNIQUE KEY unique_org_type (org_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Approval Workflows
CREATE TABLE IF NOT EXISTS approval_workflows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  expense_type_id INT NOT NULL,
  strategy ENUM('HIERARCHY', 'ROLE_BASED', 'CUSTOM') NOT NULL COMMENT 'Approval strategy',
  name VARCHAR(255) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (expense_type_id) REFERENCES expense_types(id) ON DELETE CASCADE,
  INDEX idx_org_id (org_id),
  INDEX idx_expense_type_id (expense_type_id),
  UNIQUE KEY unique_org_type_workflow (org_id, expense_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Approval Steps (Sequential steps in a workflow)
CREATE TABLE IF NOT EXISTS approval_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  step_order INT NOT NULL COMMENT 'Sequential step number (1, 2, 3, ...)',
  required_approval_level INT NULL COMMENT 'For HIERARCHY: 0=EMPLOYEE, 1=MANAGER, 2=SR_MANAGER, 3=DIRECTOR, 4=CLEVEL_FINANCE',
  required_role_id INT NULL COMMENT 'For ROLE_BASED: role_id to check',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (required_role_id) REFERENCES roles(id) ON DELETE SET NULL,
  INDEX idx_workflow_id (workflow_id),
  UNIQUE KEY unique_workflow_step (workflow_id, step_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom Approval Flows (For CUSTOM strategy)
CREATE TABLE IF NOT EXISTS custom_approval_flows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id) ON DELETE CASCADE,
  INDEX idx_workflow_id (workflow_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom Approval Flow Steps
CREATE TABLE IF NOT EXISTS custom_approval_flow_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flow_id INT NOT NULL,
  approval_step_id INT NOT NULL,
  step_number INT NOT NULL COMMENT 'Position in custom flow',
  execution_order INT NOT NULL COMMENT 'Original step_order from ApprovalStep',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flow_id) REFERENCES custom_approval_flows(id) ON DELETE CASCADE,
  FOREIGN KEY (approval_step_id) REFERENCES approval_steps(id) ON DELETE CASCADE,
  UNIQUE KEY unique_flow_step (flow_id, approval_step_id),
  INDEX idx_flow_id (flow_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  submitter_id INT NOT NULL COMMENT 'User who submitted',
  expense_type_id INT NOT NULL,
  workflow_id INT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT NULL,
  status ENUM('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAYMENT_PROCESSED') NOT NULL DEFAULT 'DRAFT',
  current_approval_step INT NULL DEFAULT 1 COMMENT 'Current step in approval workflow',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (submitter_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (expense_type_id) REFERENCES expense_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id) ON DELETE SET NULL,
  INDEX idx_org_id (org_id),
  INDEX idx_submitter_id (submitter_id),
  INDEX idx_status (status),
  INDEX idx_workflow_id (workflow_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense Approvals (Approval history)
CREATE TABLE IF NOT EXISTS expense_approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_id INT NOT NULL,
  approver_id INT NOT NULL COMMENT 'User who approved/rejected',
  action ENUM('APPROVED', 'REJECTED', 'REQUESTED_MODIFICATION') NOT NULL,
  step_number INT NOT NULL COMMENT 'Which approval step',
  comments TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_expense_id (expense_id),
  INDEX idx_approver_id (approver_id),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Log (Full action history)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_id INT NOT NULL,
  actor_id INT NOT NULL COMMENT 'User who performed action',
  action VARCHAR(100) NOT NULL COMMENT 'e.g., CREATED, SUBMITTED, APPROVED, REJECTED',
  old_value JSON NULL,
  new_value JSON NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_expense_id (expense_id),
  INDEX idx_actor_id (actor_id),
  INDEX idx_action (action),
  INDEX idx_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Organizations
INSERT INTO organizations (name, slug) VALUES
('TechCorp Inc', 'techcorp'),
('StartupXYZ', 'startupxyz'),
('Global Enterprise', 'global-enterprise');

-- Departments for TechCorp (org_id = 1)
INSERT INTO departments (org_id, name, parent_dept_id) VALUES
(1, 'Engineering', NULL),
(1, 'Finance', NULL),
(1, 'Sales', NULL),
(1, 'Backend Team', 1),  -- Parent: Engineering
(1, 'Frontend Team', 1); -- Parent: Engineering

-- Departments for StartupXYZ (org_id = 2)
INSERT INTO departments (org_id, name, parent_dept_id) VALUES
(2, 'Operations', NULL),
(2, 'Product', NULL);

-- Roles for TechCorp (org_id = 1)
INSERT INTO roles (org_id, name, approval_level) VALUES
(1, 'Employee', 0),
(1, 'Manager', 1),
(1, 'Senior Manager', 2),
(1, 'Director', 3),
(1, 'Finance Lead', 4);

-- Roles for StartupXYZ (org_id = 2)
INSERT INTO roles (org_id, name, approval_level) VALUES
(2, 'Employee', 0),
(2, 'Manager', 1),
(2, 'Finance Lead', 4);

-- Roles for Global Enterprise (org_id = 3)
INSERT INTO roles (org_id, name, approval_level) VALUES
(3, 'Employee', 0),
(3, 'Manager', 1),
(3, 'Director', 3),
(3, 'CFO', 4);

-- =====================================================
-- USERS WITH HIERARCHY (TechCorp)
-- =====================================================
-- CEO (Finance Lead, no manager)
INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(1, 2, NULL, 'alice.johnson@techcorp.com', 'Alice', 'Johnson');  -- id: 1, Finance Lead (no manager)

-- Director (Director, reports to Alice)
INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(1, 1, 1, 'bob.smith@techcorp.com', 'Bob', 'Smith');  -- id: 2, Director, manager: Alice

-- Senior Manager (Senior Manager, reports to Bob)
INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(1, 4, 2, 'charlie.brown@techcorp.com', 'Charlie', 'Brown');  -- id: 3, SR Manager, manager: Bob

-- Manager (Manager, reports to Charlie)
INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(1, 4, 3, 'david.wilson@techcorp.com', 'David', 'Wilson');  -- id: 4, Manager, manager: Charlie

-- Employee (Employee, reports to David)
INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(1, 4, 4, 'eve.davis@techcorp.com', 'Eve', 'Davis');  -- id: 5, Employee, manager: David

-- Another Employee chain (Sales)
INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(1, 3, NULL, 'frank.miller@techcorp.com', 'Frank', 'Miller');  -- id: 6, Sales Manager, no manager

INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(1, 3, 6, 'grace.taylor@techcorp.com', 'Grace', 'Taylor');  -- id: 7, Employee, manager: Frank

-- =====================================================
-- USERS WITH HIERARCHY (StartupXYZ)
-- =====================================================
INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(2, 6, NULL, 'henry.clark@startupxyz.com', 'Henry', 'Clark');  -- id: 8, Finance Lead, no manager

INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(2, 7, 8, 'iris.moore@startupxyz.com', 'Iris', 'Moore');  -- id: 9, Manager, manager: Henry

INSERT INTO users (org_id, dept_id, manager_id, email, first_name, last_name) VALUES
(2, 7, 9, 'jack.thomas@startupxyz.com', 'Jack', 'Thomas');  -- id: 10, Employee, manager: Iris

-- =====================================================
-- ASSIGN ROLES TO USERS
-- =====================================================

-- TechCorp roles
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 5),  -- Alice: Finance Lead (level 4)
(2, 9),  -- Bob: Director (level 3)
(3, 8),  -- Charlie: Senior Manager (level 2)
(4, 7),  -- David: Manager (level 1)
(5, 6),  -- Eve: Employee (level 0)
(6, 7),  -- Frank: Manager (level 1)
(7, 6);  -- Grace: Employee (level 0)

-- StartupXYZ roles
INSERT INTO user_roles (user_id, role_id) VALUES
(8, 12),  -- Henry: Finance Lead (level 4)
(9, 11),  -- Iris: Manager (level 1)
(10, 10); -- Jack: Employee (level 0)

-- =====================================================
-- EXPENSE TYPES
-- =====================================================

-- TechCorp expense types
INSERT INTO expense_types (org_id, name, max_amount, description) VALUES
(1, 'Travel', 5000.00, 'Flight, hotel, transportation'),
(1, 'Equipment', 10000.00, 'Hardware and software'),
(1, 'Meals', 500.00, 'Client meals and entertainment'),
(1, 'Training', 2000.00, 'Professional development courses');

-- StartupXYZ expense types
INSERT INTO expense_types (org_id, name, max_amount, description) VALUES
(2, 'Travel', 3000.00, 'Flight, hotel, transportation'),
(2, 'Equipment', 5000.00, 'Hardware and software'),
(2, 'Operations', 1000.00, 'General office operations');

-- =====================================================
-- APPROVAL WORKFLOWS (HIERARCHY Strategy)
-- =====================================================

-- TechCorp: Travel expenses use HIERARCHY strategy
-- Steps: Employee → Manager → Sr Manager → Director → Finance Lead
INSERT INTO approval_workflows (org_id, expense_type_id, strategy, name) VALUES
(1, 1, 'HIERARCHY', 'Travel Approval Hierarchy'),
(1, 2, 'HIERARCHY', 'Equipment Approval Hierarchy'),
(1, 3, 'HIERARCHY', 'Meal Approval Hierarchy'),
(1, 4, 'HIERARCHY', 'Training Approval Hierarchy');

-- StartupXYZ: Travel expenses use HIERARCHY strategy
INSERT INTO approval_workflows (org_id, expense_type_id, strategy, name) VALUES
(2, 5, 'HIERARCHY', 'Travel Approval Hierarchy'),
(2, 6, 'HIERARCHY', 'Equipment Approval Hierarchy'),
(2, 7, 'HIERARCHY', 'Operations Approval Hierarchy');

-- =====================================================
-- APPROVAL STEPS FOR HIERARCHY WORKFLOWS
-- =====================================================

-- TechCorp Travel Workflow (workflow_id = 1)
-- Step 1: Manager (level 1)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(1, 1, 1);
-- Step 2: Sr Manager (level 2)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(1, 2, 2);
-- Step 3: Director (level 3)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(1, 3, 3);
-- Step 4: Finance Lead (level 4)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(1, 4, 4);

-- TechCorp Equipment Workflow (workflow_id = 2)
-- Step 1: Manager (level 1)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(2, 1, 1);
-- Step 2: Director (level 3)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(2, 2, 3);
-- Step 3: Finance Lead (level 4)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(2, 3, 4);

-- TechCorp Meal Workflow (workflow_id = 3)
-- Step 1: Manager (level 1)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(3, 1, 1);
-- Step 2: Sr Manager (level 2)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(3, 2, 2);

-- TechCorp Training Workflow (workflow_id = 4)
-- Step 1: Manager (level 1)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(4, 1, 1);
-- Step 2: Director (level 3)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(4, 2, 3);

-- StartupXYZ Travel Workflow (workflow_id = 5)
-- Step 1: Manager (level 1)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(5, 1, 1);
-- Step 2: Finance Lead (level 4)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(5, 2, 4);

-- StartupXYZ Equipment Workflow (workflow_id = 6)
-- Step 1: Manager (level 1)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(6, 1, 1);
-- Step 2: Finance Lead (level 4)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(6, 2, 4);

-- StartupXYZ Operations Workflow (workflow_id = 7)
-- Step 1: Manager (level 1)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(7, 1, 1);
-- Step 2: Finance Lead (level 4)
INSERT INTO approval_steps (workflow_id, step_order, required_approval_level) VALUES
(7, 2, 4);

-- =====================================================
-- SAMPLE EXPENSES (For testing)
-- =====================================================

-- TechCorp: Eve (Employee) submits travel expense
INSERT INTO expenses (org_id, submitter_id, expense_type_id, workflow_id, amount, description, status, current_approval_step) VALUES
(1, 5, 1, 1, 2500.00, 'Flight and hotel for SF client meeting', 'SUBMITTED', 1);

-- TechCorp: Grace (Employee) submits equipment expense
INSERT INTO expenses (org_id, submitter_id, expense_type_id, workflow_id, amount, description, status, current_approval_step) VALUES
(1, 7, 2, 2, 4500.00, 'Laptop and monitor for new team member', 'SUBMITTED', 1);

-- TechCorp: Eve submits meal expense
INSERT INTO expenses (org_id, submitter_id, expense_type_id, workflow_id, amount, description, status, current_approval_step) VALUES
(1, 5, 3, 3, 300.00, 'Team lunch with client', 'SUBMITTED', 1);

-- StartupXYZ: Jack submits travel expense
INSERT INTO expenses (org_id, submitter_id, expense_type_id, workflow_id, amount, description, status, current_approval_step) VALUES
(2, 10, 5, 5, 2000.00, 'Conference attendance in NYC', 'SUBMITTED', 1);

-- StartupXYZ: Jack submits equipment expense
INSERT INTO expenses (org_id, submitter_id, expense_type_id, workflow_id, amount, description, status, current_approval_step) VALUES
(2, 10, 6, 6, 3500.00, 'Monitor and keyboard', 'SUBMITTED', 1);

-- TechCorp: Eve submits training expense
INSERT INTO expenses (org_id, submitter_id, expense_type_id, workflow_id, amount, description, status, current_approval_step) VALUES
(1, 5, 4, 4, 1500.00, 'Advanced JavaScript course', 'DRAFT', NULL);

-- =====================================================
-- VERIFICATION QUERIES (Run after insert to verify data)
-- =====================================================

-- Verify organizations
-- SELECT COUNT(*) as org_count FROM organizations;

-- Verify user hierarchy (TechCorp)
-- SELECT u.id, u.email, u.first_name, u.last_name,
--        COALESCE(m.email, 'NO MANAGER') as manager_email
-- FROM users u
-- LEFT JOIN users m ON u.manager_id = m.id
-- WHERE u.org_id = 1
-- ORDER BY u.id;

-- Verify roles assigned
-- SELECT u.email, r.name, r.approval_level
-- FROM user_roles ur
-- JOIN users u ON ur.user_id = u.id
-- JOIN roles r ON ur.role_id = r.id
-- WHERE u.org_id = 1
-- ORDER BY u.email, r.approval_level;

-- Verify workflows
-- SELECT w.id, w.name, w.strategy, et.name as expense_type
-- FROM approval_workflows w
-- JOIN expense_types et ON w.expense_type_id = et.id
-- ORDER BY w.org_id, w.id;

-- Verify approval steps
-- SELECT w.name, s.step_order,
--        COALESCE(s.required_approval_level::text, r.name) as requirement
-- FROM approval_steps s
-- LEFT JOIN roles r ON s.required_role_id = r.id
-- JOIN approval_workflows w ON s.workflow_id = w.id
-- ORDER BY w.id, s.step_order;

-- Verify expenses
-- SELECT e.id, u.email, et.name, e.amount, e.status
-- FROM expenses e
-- JOIN users u ON e.submitter_id = u.id
-- JOIN expense_types et ON e.expense_type_id = et.id
-- ORDER BY e.id;

COMMIT;
