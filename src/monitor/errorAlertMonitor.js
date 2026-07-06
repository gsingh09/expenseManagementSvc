const fs = require('fs');
const path = require('path');
const readline = require('readline');
const logger = require('../logger/logger');

/**
 * Error Alert Monitor
 * Watches error log files in real-time and triggers alerts when errors occur
 *
 * Implementation: File Watcher Approach
 * - Monitors error-YYYY-MM-DD.log files for new entries
 * - Parses JSON error logs
 * - Triggers notifications via multiple channels
 */

class ErrorAlertMonitor {
  constructor(logDir) {
    this.logDir = logDir;
    this.watchers = new Map();
    this.errorThreshold = parseInt(process.env.ALERT_THRESHOLD_ERRORS_PER_MINUTE || '5');
    this.errorCounts = new Map(); // Track errors per minute
  }

  /**
   * Start monitoring error log files
   * Watches directory for new/modified error-YYYY-MM-DD.log files
   */
  start() {
    logger.info('ALERT_MONITOR_START', {
      logDir: this.logDir,
      errorThreshold: this.errorThreshold,
      message: 'Error alert monitor started'
    });

    // Watch the logs directory for changes
    // FUTURE IMPLEMENTATION:
    // fs.watch(this.logDir, (eventType, filename) => {
    //   if (filename && filename.startsWith('error-') && filename.endsWith('.log')) {
    //     this.handleLogFileChange(filename);
    //   }
    // });

    // Also watch for new files created each day
    // FUTURE IMPLEMENTATION:
    // setInterval(() => {
    //   this.checkForNewLogFiles();
    // }, 60000); // Check every minute
  }

  /**
   * Handle log file changes - read new entries and trigger alerts
   * FUTURE IMPLEMENTATION
   *
   * @param {string} filename - Name of the log file that changed
   */
  handleLogFileChange(filename) {
    const filePath = path.join(this.logDir, filename);

    // FUTURE CODE:
    // const rl = readline.createInterface({
    //   input: fs.createReadStream(filePath),
    //   crlfDelay: Infinity
    // });

    // rl.on('line', (line) => {
    //   if (line.trim()) {
    //     try {
    //       const errorLog = JSON.parse(line);
    //       this.processErrorLog(errorLog);
    //     } catch (e) {
    //       // Skip malformed JSON lines
    //     }
    //   }
    // });
  }

  /**
   * Process individual error log entry
   * FUTURE IMPLEMENTATION
   *
   * @param {Object} errorLog - Parsed JSON error object from error.log
   * Expected format:
   * {
   *   timestamp: "2026-07-06 10:30:45",
   *   requestId: "1625558445123-a1b2c3d4e5",
   *   level: "ERROR",
   *   message: "Database connection failed",
   *   details: { error: "Connection timeout", code: "ETIMEDOUT" },
   *   stack: "Error: ...\n  at ..."
   * }
   */
  processErrorLog(errorLog) {
    // FUTURE CODE:
    // 1. Increment error count for current minute
    // const now = new Date().getMinutes();
    // this.errorCounts.set(now, (this.errorCounts.get(now) || 0) + 1);

    // 2. Check if error threshold is exceeded
    // if (this.errorCounts.get(now) > this.errorThreshold) {
    //   this.triggerAlert('THRESHOLD_EXCEEDED', errorLog);
    // }

    // 3. Check if error is critical (5xx, timeout, database error)
    // if (this.isCriticalError(errorLog)) {
    //   this.triggerAlert('CRITICAL_ERROR', errorLog);
    // }

    // 4. Check for error patterns (repeated errors from same requestId)
    // if (this.isRepeatError(errorLog)) {
    //   this.triggerAlert('REPEAT_ERROR', errorLog);
    // }

    // 5. Log to monitoring system
    // logger.warn('ERROR_DETECTED', {
    //   errorLog,
    //   alertTriggered: true
    // });
  }

  /**
   * Check if error is critical and needs immediate notification
   * FUTURE IMPLEMENTATION
   *
   * @param {Object} errorLog - Error log object
   * @returns {boolean} true if critical
   */
  isCriticalError(errorLog) {
    // FUTURE CODE:
    // const criticalKeywords = [
    //   'Database',
    //   'Connection',
    //   'Timeout',
    //   'Authentication',
    //   'Authorization',
    //   'OutOfMemory',
    //   'CPU usage'
    // ];

    // return criticalKeywords.some(keyword =>
    //   errorLog.message.includes(keyword)
    // );
  }

  /**
   * Check if this is a repeat error (same type within X seconds)
   * FUTURE IMPLEMENTATION
   *
   * @param {Object} errorLog - Error log object
   * @returns {boolean} true if repeat error
   */
  isRepeatError(errorLog) {
    // FUTURE CODE:
    // const errorKey = `${errorLog.message}`;
    // const lastOccurrence = this.recentErrors.get(errorKey);

    // if (lastOccurrence) {
    //   const timeDiff = new Date() - new Date(lastOccurrence);
    //   if (timeDiff < 30000) { // Within 30 seconds
    //     return true;
    //   }
    // }

    // this.recentErrors.set(errorKey, new Date().toISOString());
    // return false;
  }

  /**
   * Trigger alert via multiple channels
   * FUTURE IMPLEMENTATION
   *
   * @param {string} alertType - Type of alert (CRITICAL_ERROR, THRESHOLD_EXCEEDED, etc.)
   * @param {Object} errorLog - The error log that triggered the alert
   */
  triggerAlert(alertType, errorLog) {
    // FUTURE CODE:
    // const alertMessage = this.formatAlertMessage(alertType, errorLog);

    // Promise.all([
    //   this.sendSlackNotification(alertMessage),
    //   this.sendEmailAlert(alertMessage),
    //   this.sendSMSAlert(alertMessage),
    //   this.postToDashboard(alertMessage)
    // ]).catch(err => {
    //   logger.error('ALERT_DELIVERY_FAILED', { error: err.message });
    // });
  }

  /**
   * Format alert message for notification channels
   * FUTURE IMPLEMENTATION
   *
   * @param {string} alertType - Type of alert
   * @param {Object} errorLog - Error log object
   * @returns {Object} formatted message for notifications
   */
  formatAlertMessage(alertType, errorLog) {
    // FUTURE CODE:
    // return {
    //   title: `[${alertType}] Expense Management Service`,
    //   severity: this.getSeverity(alertType),
    //   timestamp: errorLog.timestamp,
    //   requestId: errorLog.requestId,
    //   message: errorLog.message,
    //   details: errorLog.details,
    //   stack: errorLog.stack,
    //   actionUrl: `https://logs.company.com/search?requestId=${errorLog.requestId}`
    // };
  }

  /**
   * Send Slack notification
   * FUTURE IMPLEMENTATION
   *
   * @param {Object} alertMessage - Formatted alert message
   * Requires: SLACK_WEBHOOK_URL env variable
   */
  async sendSlackNotification(alertMessage) {
    // FUTURE CODE:
    // const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    // if (!webhookUrl) return;

    // const payload = {
    //   text: alertMessage.title,
    //   attachments: [{
    //     color: alertMessage.severity === 'CRITICAL' ? 'danger' : 'warning',
    //     fields: [
    //       { title: 'RequestId', value: alertMessage.requestId, short: true },
    //       { title: 'Time', value: alertMessage.timestamp, short: true },
    //       { title: 'Error', value: alertMessage.message },
    //       { title: 'Details', value: JSON.stringify(alertMessage.details), short: false }
    //     ],
    //     actions: [{
    //       type: 'button',
    //       text: 'View Logs',
    //       url: alertMessage.actionUrl
    //     }]
    //   }]
    // };

    // FUTURE IMPLEMENTATION:
    // try {
    //   const response = await fetch(webhookUrl, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload)
    //   });
    //   logger.debug('SLACK_ALERT_SENT', { status: response.status });
    // } catch (err) {
    //   logger.error('SLACK_ALERT_FAILED', { error: err.message });
    // }
  }

  /**
   * Send email notification
   * FUTURE IMPLEMENTATION
   *
   * @param {Object} alertMessage - Formatted alert message
   * Requires: EMAIL_ALERTS env variable (comma-separated emails)
   */
  async sendEmailAlert(alertMessage) {
    // FUTURE CODE:
    // const emails = (process.env.EMAIL_ALERTS || '').split(',').filter(e => e);
    // if (emails.length === 0) return;

    // FUTURE IMPLEMENTATION (using nodemailer):
    // const emailBody = `
    //   <h2>${alertMessage.title}</h2>
    //   <p><strong>RequestId:</strong> ${alertMessage.requestId}</p>
    //   <p><strong>Timestamp:</strong> ${alertMessage.timestamp}</p>
    //   <p><strong>Error:</strong> ${alertMessage.message}</p>
    //   <pre>${alertMessage.stack}</pre>
    //   <a href="${alertMessage.actionUrl}">View Full Logs</a>
    // `;

    // try {
    //   await mailer.send({
    //     to: emails.join(','),
    //     subject: `Alert: ${alertMessage.title}`,
    //     html: emailBody
    //   });
    //   logger.debug('EMAIL_ALERT_SENT', { recipients: emails.length });
    // } catch (err) {
    //   logger.error('EMAIL_ALERT_FAILED', { error: err.message });
    // }
  }

  /**
   * Send SMS alert for critical errors
   * FUTURE IMPLEMENTATION
   *
   * @param {Object} alertMessage - Formatted alert message
   * Requires: SMS_ALERT_NUMBERS env variable
   */
  async sendSMSAlert(alertMessage) {
    // FUTURE CODE:
    // if (alertMessage.severity !== 'CRITICAL') return;

    // const numbers = (process.env.SMS_ALERT_NUMBERS || '').split(',').filter(n => n);
    // if (numbers.length === 0) return;

    // FUTURE IMPLEMENTATION (using Twilio or similar):
    // const message = `🚨 ${alertMessage.title}\n${alertMessage.message}\nReqID: ${alertMessage.requestId}`;

    // try {
    //   for (const number of numbers) {
    //     await smsProvider.send({
    //       to: number,
    //       body: message
    //     });
    //   }
    //   logger.debug('SMS_ALERT_SENT', { recipients: numbers.length });
    // } catch (err) {
    //   logger.error('SMS_ALERT_FAILED', { error: err.message });
    // }
  }

  /**
   * Post alert to monitoring dashboard
   * FUTURE IMPLEMENTATION
   *
   * @param {Object} alertMessage - Formatted alert message
   * Integrations: Datadog, New Relic, Prometheus, etc.
   */
  async postToDashboard(alertMessage) {
    // FUTURE CODE:
    // const dashboardUrl = process.env.MONITORING_DASHBOARD_API;
    // if (!dashboardUrl) return;

    // FUTURE IMPLEMENTATION:
    // try {
    //   const response = await fetch(`${dashboardUrl}/alerts`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${process.env.DASHBOARD_API_KEY}`
    //     },
    //     body: JSON.stringify({
    //       alert_type: alertMessage.title,
    //       severity: alertMessage.severity,
    //       service: 'expense-management-svc',
    //       message: alertMessage.message,
    //       metadata: {
    //         requestId: alertMessage.requestId,
    //         timestamp: alertMessage.timestamp,
    //         stack: alertMessage.stack
    //       }
    //     })
    //   });
    //   logger.debug('DASHBOARD_ALERT_POSTED', { status: response.status });
    // } catch (err) {
    //   logger.error('DASHBOARD_ALERT_FAILED', { error: err.message });
    // }
  }

  /**
   * Get severity level based on error type
   * FUTURE IMPLEMENTATION
   *
   * @param {string} alertType - Type of alert
   * @returns {string} severity level (CRITICAL, HIGH, MEDIUM)
   */
  getSeverity(alertType) {
    // FUTURE CODE:
    // const severityMap = {
    //   'CRITICAL_ERROR': 'CRITICAL',
    //   'THRESHOLD_EXCEEDED': 'HIGH',
    //   'REPEAT_ERROR': 'MEDIUM',
    //   'DATABASE_ERROR': 'CRITICAL',
    //   'TIMEOUT_ERROR': 'HIGH'
    // };
    // return severityMap[alertType] || 'MEDIUM';
  }

  /**
   * Check for and process any new log files (called periodically)
   * FUTURE IMPLEMENTATION
   */
  checkForNewLogFiles() {
    // FUTURE CODE:
    // try {
    //   const files = fs.readdirSync(this.logDir);
    //   const errorFiles = files.filter(f =>
    //     f.startsWith('error-') && f.endsWith('.log')
    //   );

    //   for (const file of errorFiles) {
    //     if (!this.watchers.has(file)) {
    //       this.watchFile(file);
    //     }
    //   }
    // } catch (err) {
    //   logger.error('ERROR_CHECKING_LOG_FILES', { error: err.message });
    // }
  }

  /**
   * Watch a specific log file for changes
   * FUTURE IMPLEMENTATION
   *
   * @param {string} filename - Log file to watch
   */
  watchFile(filename) {
    // FUTURE CODE:
    // const filePath = path.join(this.logDir, filename);
    // const watcher = fs.watch(filePath, (eventType) => {
    //   if (eventType === 'change') {
    //     this.handleLogFileChange(filename);
    //   }
    // });
    // this.watchers.set(filename, watcher);
  }

  /**
   * Stop monitoring
   * FUTURE IMPLEMENTATION
   */
  stop() {
    // FUTURE CODE:
    // for (const watcher of this.watchers.values()) {
    //   watcher.close();
    // }
    // this.watchers.clear();
    // logger.info('ALERT_MONITOR_STOPPED', {
    //   message: 'Error alert monitor stopped'
    // });
  }
}

module.exports = ErrorAlertMonitor;
