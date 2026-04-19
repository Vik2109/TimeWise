const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs   = require('fs');

// Ensure logs directory exists
const logDir = process.env.LOG_DIR
  ? path.resolve(process.cwd(), process.env.LOG_DIR)
  : path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// ── Custom format ────────────────────────────────────────────
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// ── Transports ───────────────────────────────────────────────
const transports = [];

// Console — always on, verbose in dev
transports.push(
  new winston.transports.Console({
    level:  process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: consoleFormat,
    silent: process.env.NODE_ENV === 'test',
  })
);

// File rotation — production only
if (process.env.NODE_ENV === 'production') {
  // All logs (info and above)
  transports.push(
    new DailyRotateFile({
      filename:       path.join(logDir, 'app-%DATE%.log'),
      datePattern:    'YYYY-MM-DD',
      zippedArchive:  true,
      maxSize:        '20m',
      maxFiles:       '30d',
      level:          process.env.LOG_LEVEL || 'info',
      format:         logFormat,
    })
  );

  // Error logs only
  transports.push(
    new DailyRotateFile({
      filename:       path.join(logDir, 'error-%DATE%.log'),
      datePattern:    'YYYY-MM-DD',
      zippedArchive:  true,
      maxSize:        '20m',
      maxFiles:       '90d',
      level:          'error',
      format:         logFormat,
    })
  );
}

// ── Logger instance ──────────────────────────────────────────
const logger = winston.createLogger({
  level:            process.env.LOG_LEVEL || 'info',
  format:           logFormat,
  transports,
  exitOnError:      false,
  exceptionHandlers: process.env.NODE_ENV === 'production' ? [
    new DailyRotateFile({
      filename:    path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles:    '30d',
    }),
  ] : [],
  rejectionHandlers: process.env.NODE_ENV === 'production' ? [
    new DailyRotateFile({
      filename:    path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles:    '30d',
    }),
  ] : [],
});

// Stream for Morgan HTTP logger
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
