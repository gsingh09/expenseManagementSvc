# Deployment Guide - Expense Management Service

This guide explains how to build and deploy the Expense Management Service using Apache Ant and PM2.

## Overview

The deployment process uses:
- **Apache Ant** (`build.xml`) — Orchestrates the build process
- **PM2** (`ecosystem.json`) — Manages the Node.js application on the server
- **Environment-specific configs** — Different settings for each environment

## Build Targets

### 1. Basic Build
```bash
ant build
```
**What it does:**
- Cleans previous build artifacts
- Copies source files from `src/`
- Copies `package.json` and `package-lock.json`
- Copies entire `config/` folder
- Installs npm dependencies with `--production` flag
- Creates compressed archive (`dist/expenseManagementSvc.tgz`)

**Use case:** General development builds

---

### 2. Production Ready Build
```bash
ant prod-ready
```
**What it does:**
- Same as `build` +
- Copies **production** config files from `config/expense-management-svc/prod/`:
  - `application.env` — Production environment variables
  - `ecosystem.json` — PM2 cluster configuration (4 instances)

**Config used:**
- `CONFIG_FILE`: `./config/expense-management-svc/prod`
- `NODE_ENV`: `production`
- `LOG_DIR`: `./logs/production`
- `LOG_LEVEL`: `warn` (only warnings and errors)
- **Instances:** 4 (cluster mode for load balancing)
- **Watch:** Disabled (no auto-reload)
- **Max memory:** 500MB per instance

**Output:** `dist/expenseManagementSvc.tgz` ready for production deployment

---

### 3. Test Build
```bash
ant test-ready
```
**What it does:**
- Same as `build` +
- Copies **test** config files from `config/expense-management-svc/test/`:
  - `application.env` — Test environment variables
  - `ecosystem.json` — PM2 configuration (2 instances)
- Includes dev dependencies (no `--production` flag)

**Config used:**
- `CONFIG_FILE`: `./config/expense-management-svc/test`
- `NODE_ENV`: `test`
- `LOG_DIR`: `./logs/test`
- `LOG_LEVEL`: `info` (info level logs)
- **Instances:** 2
- **Watch:** Enabled (auto-reload on file changes)
- **Max memory:** 300MB per instance

**Output:** `dist/expenseManagementSvc.tgz` with dev dependencies included

---

### 4. Local Development Build
```bash
ant build
```
Then use the local ecosystem.json directly:
```bash
pm2 start config/expense-management-svc/local/ecosystem.json
```

**Config used:**
- `CONFIG_FILE`: `./config/expense-management-svc/local`
- `NODE_ENV`: `local`
- `LOG_DIR`: `./logs`
- `LOG_LEVEL`: `debug` (verbose logging)
- **Instances:** 1 (fork mode, not cluster)
- **Watch:** Enabled with 1s delay (immediate reload)
- **Max memory:** 200MB

**Output:** Ready for immediate development

---

## Deployment Steps

### Step 1: Build the Application
```bash
# Production build
ant prod-ready

# This creates: dist/expenseManagementSvc.tgz
```

### Step 2: Deploy to Server
```bash
# Copy the archive to your server
scp dist/expenseManagementSvc.tgz user@server:/path/to/deployment/

# SSH into server and extract
cd /path/to/deployment/
tar -xzf expenseManagementSvc.tgz
cd expenseManagementSvc
```

### Step 3: Install PM2 (if not already installed)
```bash
npm install -g pm2
```

### Step 4: Start with PM2
```bash
# From the deployed application directory
pm2 start ecosystem.json --name expenseManagementSvc

# View running processes
pm2 list

# View logs
pm2 logs expenseManagementSvc

# Monitor in real-time
pm2 monit
```

### Step 5: Setup PM2 as System Service (Optional but Recommended)
```bash
# Auto-start PM2 on system boot
pm2 startup
pm2 save
```

---

## PM2 Configuration Explained

Each environment has an `ecosystem.json` file:

| Setting | Production | Test | Local |
|---------|------------|------|-------|
| **instances** | 4 | 2 | 1 |
| **exec_mode** | cluster | cluster | fork |
| **watch** | false | true | true |
| **LOG_LEVEL** | warn | info | debug |
| **max_memory** | 500M | 300M | 200M |
| **restart_delay** | 4000ms | 4000ms | 1000ms |

### Key PM2 Options:
- **instances**: Number of worker processes (cluster mode only)
- **exec_mode**: `cluster` (for load balancing) or `fork` (single process)
- **watch**: Auto-restart on file changes
- **ignore_watch**: Folders to exclude from file watching
- **merge_logs**: Combine logs from all instances
- **error_file**: PM2 error log path
- **out_file**: PM2 output log path
- **max_memory_restart**: Auto-restart if memory exceeds limit

---

## Log Files

Two log types are maintained:

### Application Logs (Winston)
Located in configured `LOG_DIR`:
- **error-YYYY-MM-DD.log** — Errors only (JSON format, for alerts)
- **combined-YYYY-MM-DD.log** — All logs (human-readable)
- **Day-wise rotation** with configurable retention

### PM2 Logs
Located in application directory:
- **logs/pm2-error.log** — PM2 framework errors
- **logs/pm2-out.log** — STDOUT from application
- **logs/pm2-combined.log** — All PM2 output

---

## Environment Variables

Each environment specifies:

```bash
# From application.env file
NODE_ENV=production
CONFIG_FILE=./config/expense-management-svc/prod
LOG_DIR=./logs/production
LOG_LEVEL=warn
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=xxxxx
DB_NAME=expense_management
```

---

## Common PM2 Commands

```bash
# View all running processes
pm2 list

# View logs
pm2 logs expenseManagementSvc
pm2 logs expenseManagementSvc --err   # Only errors
pm2 logs expenseManagementSvc --lines 100

# Manage processes
pm2 start ecosystem.json
pm2 restart expenseManagementSvc
pm2 reload expenseManagementSvc       # Zero-downtime reload
pm2 stop expenseManagementSvc
pm2 delete expenseManagementSvc

# Monitor
pm2 monit                              # Real-time dashboard
pm2 info expenseManagementSvc          # Process details

# Save current PM2 state
pm2 save

# Resurrect saved processes
pm2 resurrect
```

---

## Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs expenseManagementSvc --err

# Check application config
cat config/expense-management-svc/prod/application.env

# Verify database connectivity
# Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in application.env
```

### High memory usage
```bash
# Check memory per instance
pm2 monit

# Increase max_memory_restart in ecosystem.json and reload
pm2 reload expenseManagementSvc
```

### Logs not appearing
```bash
# Verify LOG_DIR exists and is writable
ls -la ./logs/production/

# Check LOG_LEVEL setting
# production = warn (only warnings/errors logged)
```

---

## Clean Build & Redeploy

If you need to rebuild from scratch:

```bash
# Local development
ant clean
ant build

# Production
ant clean
ant prod-ready
```

The `clean` target removes:
- `build/` directory
- `dist/` directory

Then all files are re-copied and re-packaged.
