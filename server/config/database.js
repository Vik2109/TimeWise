const mongoose = require('mongoose');
const logger   = require('../utils/logger');

// ── Connection options tuned for production ──────────────────
const getConnectionOptions = () => ({
  maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE) || 10,
  minPoolSize: 2,

  serverSelectionTimeoutMS:
    parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,

  socketTimeoutMS:
    parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,

  connectTimeoutMS:
    parseInt(process.env.MONGO_CONNECT_TIMEOUT) || 10000,

  heartbeatFrequencyMS: 10000,

  family: 4, // keep IPv4
});

// ── Retry logic ──────────────────────────────────────────────
const MAX_RETRIES    = 5;
const RETRY_INTERVAL = 5000; // ms

let retryCount = 0;

const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, getConnectionOptions());
    retryCount = 0; // reset on success
  } catch (err) {
    retryCount++;
    logger.error(`MongoDB connection attempt ${retryCount} failed: ${err.message}`);

    if (retryCount >= MAX_RETRIES) {
      logger.warn(`MongoDB connection failed after ${MAX_RETRIES} attempts — will keep retrying...`);
    }

    logger.info(`Retrying MongoDB connection in ${RETRY_INTERVAL / 1000}s... (${retryCount}/${MAX_RETRIES})`);
    setTimeout(connectWithRetry, RETRY_INTERVAL);
  }
};

// ── Connection event listeners ───────────────────────────────
const registerConnectionEvents = () => {
  const db = mongoose.connection;

  db.on('connected', () => {
    logger.info(`✅ MongoDB connected — host: ${db.host}:${db.port}/${db.name}`);
  });

  db.on('disconnected', () => {
    logger.warn('⚠️  MongoDB disconnected');
  });

  db.on('reconnected', () => {
    logger.info('🔁 MongoDB reconnected');
  });

  db.on('error', (err) => {
    logger.error(`MongoDB error: ${err.message}`);
  });

  // Graceful shutdown — close DB before process exits
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received — closing MongoDB connection`);
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed gracefully');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  // process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
};

// ── Monitor connection pool ──────────────────────────────────
const logPoolStats = () => {
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const client = mongoose.connection.getClient();
      if (client) {
        const pool = client.topology?.s?.pool;
        if (pool) {
          logger.debug(`DB Pool — total: ${pool.totalConnectionCount}, available: ${pool.availableConnectionCount}`);
        }
      }
    }, 60000); // log every minute in dev
  }
};

// ── Main connect function ────────────────────────────────────
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    logger.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  // Validate URI format
  if (!process.env.MONGO_URI.startsWith('mongodb')) {
    logger.error('MONGO_URI must start with "mongodb://" or "mongodb+srv://"');
    process.exit(1);
  }

  registerConnectionEvents();

  logger.info('Connecting to MongoDB...');
  await connectWithRetry();

  if (process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true') {
    mongoose.set('debug', (collectionName, method, query) => {
      logger.debug(`Mongoose: ${collectionName}.${method} ${JSON.stringify(query)}`);
    });
  }

  logPoolStats();
};

// ── Health check helper ──────────────────────────────────────
const getDBHealth = () => {
  const states = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' };
  return {
    status:    states[mongoose.connection.readyState] || 'unknown',
    host:      mongoose.connection.host,
    port:      mongoose.connection.port,
    name:      mongoose.connection.name,
    poolSize:  parseInt(process.env.MONGO_POOL_SIZE) || 10,
    readyState: mongoose.connection.readyState,
  };
};

module.exports = { connectDB, getDBHealth };
