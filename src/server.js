
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const slotRoutes = require('./routes/slotRoutes');
const systemRoutes = require('./routes/systemRoutes');
const { optionalAuth } = require('./middleware/auth');
const { initDiamondEventListeners } = require('./listeners/diamondEventListener');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed =
        process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || ['http://localhost:3000'];
      if (!origin || allowed.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '') || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '') || 100,
    message: { error: 'Too many requests from this IP, try later.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Auth limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many auth attempts, try later.' },
});

// Parsers and compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: {
      write: (msg) => logger.info(msg.trim()),
    },
  })
);

// Health check
app.get('/health', (_req, res) =>
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  })
);

// API Status
app.get('/api/status', optionalAuth, (req, res) =>
  res.json({
    status: 'Fortunity NXT API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    authenticated: !!req.user,
    blockchain: {
      network: process.env.BLOCKCHAIN_NETWORK || 'unknown',
      contractAddress: process.env.CONTRACT_ADDRESS || 'not configured',
    },
  })
);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/system', systemRoutes);

// Static file serving for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Fallback 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Graceful shutdown initiated');
  if (global.server) {
    global.server.close((err) => {
      if (err) {
        logger.error('Error during server shutdown', err);
        process.exit(1);
      }
      process.exit(0);
    });

    setTimeout(() => {
      logger.warn('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGQUIT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
async function startServer() {
  try {
    await connectDB();
    logger.info('MongoDB connected');

    try {
      initDiamondEventListeners();
      console.log('🎧 Diamond event listeners initialized');
    } catch (err) {
      console.error('❌ Failed to init event listeners:', err);
    }
    

    const PORT = process.env.PORT || 8000;
    const server = app.listen(PORT, () => {
      logger.info(`Fortunity NXT API running on port ${PORT}`);
    });

    global.server = server;
  } catch (error) {
    logger.error('Startup failed', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;
