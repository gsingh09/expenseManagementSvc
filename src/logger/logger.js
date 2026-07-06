const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Get log directory from environment or use default
const logDir = process.env.LOG_DIR || path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Determine log level based on environment
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const envLogLevels = {
    production: 'warn',
    staging: 'info',
    development: 'debug',
    local: 'debug'
  };
  return process.env.LOG_LEVEL || envLogLevels[env] || 'info';
};

const logLevel = getLogLevel();

// Enhanced log format with metadata and requestId
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, requestId, ...args }) => {
    let meta = '';
    const reqIdStr = requestId ? ` [requestId: ${requestId}]` : '';
    if (args && Object.keys(args).length > 0 && args.service) {
      const { service, timestamp: _, ...rest } = args;
      if (Object.keys(rest).length > 0) {
        meta = ` | ${JSON.stringify(rest)}`;
      }
    }
    const msg = `${timestamp}${reqIdStr} [${level.toUpperCase()}]: ${message}${meta}`;
    return args.stack ? `${msg}\n${args.stack}` : msg;
  })
);

// Error log format - JSON format for machine-readable logs and alerting
const errorLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, requestId, ...args }) => {
    const errorObj = {
      timestamp,
      requestId: requestId || null,
      level: level.toUpperCase(),
      message,
      details: args && Object.keys(args).length > 1 ? args : undefined,
      stack: args.stack || null
    };
    return JSON.stringify(errorObj);
  })
);

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'expense-management-svc' },
  transports: [
    // Error file - day-wise rotation, JSON format for alerts and debugging
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: errorLogFormat,
      maxSize: '20m',
      maxDays: '14d',
      auditFile: path.join(logDir, '.audit-error.json')
    }),
    // Combined file - day-wise rotation, all logs (info, debug, warn, error)
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: '20m',
      maxDays: '7d',
      auditFile: path.join(logDir, '.audit-combined.json')
    })
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: errorLogFormat,
      maxSize: '20m',
      maxDays: '14d',
      auditFile: path.join(logDir, '.audit-error.json')
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: errorLogFormat,
      maxSize: '20m',
      maxDays: '14d',
      auditFile: path.join(logDir, '.audit-error.json')
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, requestId, ...args }) => {
          let meta = '';
          const reqIdStr = requestId ? ` [requestId: ${requestId}]` : '';
          if (args && Object.keys(args).length > 0 && args.service) {
            const { service, timestamp: _, ...rest } = args;
            if (Object.keys(rest).length > 0) {
              meta = ` | ${JSON.stringify(rest)}`;
            }
          }
          const msg = `${timestamp}${reqIdStr} [${level}]: ${message}${meta}`;
          return args.stack ? `${msg}\n${args.stack}` : msg;
        })
      )
    })
  );
}

module.exports = logger;
