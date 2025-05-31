# Fortunity NXT Backend Setup Script
# Run this script in PowerShell as Administrator or with execution policy set

param(
    [string]$ProjectPath = "C:\Projects\fortunity-nxt-backend"
)

Write-Host "Creating Fortunity NXT Backend Project Structure..." -ForegroundColor Green
Write-Host "Project Path: $ProjectPath" -ForegroundColor Yellow

# Create main project directory
if (!(Test-Path $ProjectPath)) {
    New-Item -ItemType Directory -Path $ProjectPath -Force
    Write-Host "Created main project directory" -ForegroundColor Green
}

# Set location to project directory
Set-Location $ProjectPath

# Create folder structure
$folders = @(
    "config",
    "controllers", 
    "middleware",
    "models",
    "routes",
    "scripts",
    "utils",
    "services",
    "tests"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force
        Write-Host "Created folder: $folder" -ForegroundColor Cyan
    }
}

# Create placeholder files with basic content
$files = @{
    # Root files
    "package.json" = @'
{
  "name": "fortunity-nxt-backend",
  "version": "1.0.0",
  "description": "Fortunity NXT Semi-DAPP Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node scripts/test.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "web3": "^4.1.1",
    "winston": "^3.10.0",
    "joi": "^17.9.2",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
'@

    ".env.example" = @'
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fortunity_nxt
MONGODB_TEST_URI=mongodb://localhost:27017/fortunity_nxt_test

# Blockchain Configuration
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
PRIVATE_KEY=your_private_key_here
CHAIN_ID=1

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin Configuration
ADMIN_ADDRESSES=0x1234567890123456789012345678901234567890

# Pool Distribution
POOL_DISTRIBUTION_DAYS=5,15,25
'@

    "server.js" = @'
// Main server file - Entry point
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const logger = require("./config/logger");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const slotRoutes = require("./routes/slotRoutes");
const systemRoutes = require("./routes/systemRoutes");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
});
app.use(limiter);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/slots", slotRoutes);
app.use("/api/v1/system", systemRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});
'@

    "README.md" = @'
# Fortunity NXT Backend API

## Overview
Backend API for Fortunity NXT Semi-DAPP with 2x2 Forced Matrix MLM structure.

## Installation
1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Run `npm install`
4. Start MongoDB
5. Run `npm start`

## API Endpoints
- `/api/v1/auth` - Authentication
- `/api/v1/users` - User management
- `/api/v1/slots` - Slot operations
- `/api/v1/system` - System information

## Development
- `npm run dev` - Start with nodemon
- `npm test` - Run tests
'@

    # Config files
    "config/db.js" = @'
const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
'@

    "config/logger.js" = @'
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "fortunity-nxt-api" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
'@

    # Controllers
    "controllers/authController.js" = @'
// Authentication controller
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const authController = {
  // Generate nonce for wallet authentication
  generateNonce: async (req, res) => {
    try {
      // Implementation here
      res.json({ message: "Generate nonce endpoint" });
    } catch (error) {
      logger.error("Generate nonce error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Verify signature and login
  login: async (req, res) => {
    try {
      // Implementation here
      res.json({ message: "Login endpoint" });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

module.exports = authController;
'@

    "controllers/userController.js" = @'
// User controller
const logger = require("../config/logger");

const userController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      // Implementation here
      res.json({ message: "Get profile endpoint" });
    } catch (error) {
      logger.error("Get profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Get user earnings
  getEarnings: async (req, res) => {
    try {
      // Implementation here
      res.json({ message: "Get earnings endpoint" });
    } catch (error) {
      logger.error("Get earnings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

module.exports = userController;
'@

    "controllers/slotController.js" = @'
// Slot controller
const logger = require("../config/logger");

const slotController = {
  // Get slot information
  getSlotInfo: async (req, res) => {
    try {
      // Implementation here
      res.json({ message: "Get slot info endpoint" });
    } catch (error) {
      logger.error("Get slot info error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Purchase slot
  purchaseSlot: async (req, res) => {
    try {
      // Implementation here
      res.json({ message: "Purchase slot endpoint" });
    } catch (error) {
      logger.error("Purchase slot error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

module.exports = slotController;
'@

    "controllers/systemController.js" = @'
// System controller
const logger = require("../config/logger");

const systemController = {
  // Get platform statistics
  getStats: async (req, res) => {
    try {
      // Implementation here
      res.json({ message: "Get stats endpoint" });
    } catch (error) {
      logger.error("Get stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

module.exports = systemController;
'@

    # Middleware
    "middleware/authMiddleware.js" = @'
// Authentication middleware
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const authMiddleware = {
  // Verify JWT token
  verifyToken: (req, res, next) => {
    try {
      // Implementation here
      next();
    } catch (error) {
      logger.error("Auth middleware error:", error);
      res.status(401).json({ error: "Unauthorized" });
    }
  }
};

module.exports = authMiddleware;
'@

    # Models
    "models/User.js" = @'
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  referralId: { type: String, unique: true },
  referrerAddress: { type: String },
  level: { type: Number, default: 1 },
  matrix: { type: Number, default: 1 },
  slots: { type: [Number], default: [] },
  totalEarnings: { type: Number, default: 0 },
  rebirths: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
'@

    "models/Transaction.js" = @'
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  txHash: { type: String, required: true, unique: true },
  userAddress: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  slot: { type: Number },
  status: { type: String, default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
'@

    "models/Income.js" = @'
const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({
  userAddress: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  fromAddress: { type: String },
  slot: { type: Number },
  txHash: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Income", incomeSchema);
'@

    "models/Slot.js" = @'
const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  slotNumber: { type: Number, required: true },
  price: { type: Number, required: true },
  matrixIncome: { type: Number, required: true },
  levelIncome: { type: Number, required: true },
  poolIncome: { type: Number, required: true },
  rebirthSlot: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model("Slot", slotSchema);
'@

    # Routes
    "routes/authRoutes.js" = @'
const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/nonce", authController.generateNonce);
router.post("/login", authController.login);

module.exports = router;
'@

    "routes/userRoutes.js" = @'
const express = require("express");
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/profile", verifyToken, userController.getProfile);
router.get("/earnings", verifyToken, userController.getEarnings);

module.exports = router;
'@

    "routes/slotRoutes.js" = @'
const express = require("express");
const slotController = require("../controllers/slotController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/info/:slotNumber", slotController.getSlotInfo);
router.post("/purchase", verifyToken, slotController.purchaseSlot);

module.exports = router;
'@

    "routes/systemRoutes.js" = @'
const express = require("express");
const systemController = require("../controllers/systemController");
const router = express.Router();

router.get("/stats", systemController.getStats);

module.exports = router;
'@

    # Scripts
    "scripts/test.js" = @'
// Basic API test script
const http = require("http");

const testEndpoint = (path, method = "GET") => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });

    req.on("error", reject);
    req.end();
  });
};

async function runTests() {
  console.log("Running API tests...");

  try {
    const health = await testEndpoint("/health");
    console.log("Health check:", health.status === 200 ? "PASS" : "FAIL");
  } catch (error) {
    console.log("Tests failed:", error.message);
  }
}

runTests();
'@

    "scripts/migration.js" = @'
// Database migration script
const mongoose = require("mongoose");
require("dotenv").config();

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Add migration logic here

    console.log("Migration completed");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
'@

    # Utils
    "utils/helperFunctions.js" = @'
// Helper utility functions

const helperFunctions = {
  // Generate random string
  generateRandomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Validate Ethereum address
  isValidAddress: (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  // Calculate percentage
  calculatePercentage: (amount, percentage) => {
    return (amount * percentage) / 100;
  }
};

module.exports = helperFunctions;
'@

    # Services
    "services/eventListener.js" = @'
// Blockchain event listener service
const Web3 = require("web3");
const logger = require("../config/logger");

class EventListener {
  constructor() {
    this.web3 = new Web3(process.env.WEB3_PROVIDER_URL);
    this.contractAddress = process.env.CONTRACT_ADDRESS;
  }

  async startListening() {
    try {
      logger.info("Starting event listener...");
      // Implementation here
    } catch (error) {
      logger.error("Event listener error:", error);
    }
  }
}

module.exports = EventListener;
'@

    # Docker files
    "Dockerfile" = @'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
'@

    "docker-compose.yml" = @'
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
    volumes:
      - .:/app
      - /app/node_modules

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
'@

    ".gitignore" = @'
node_modules/
.env
*.log
.DS_Store
dist/
build/
coverage/
'@
}

# Create all files
foreach ($file in $files.Keys) {
    $filePath = Join-Path $PWD $file
    $directory = Split-Path $filePath -Parent

    if (!(Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force
    }

    $files[$file] | Out-File -FilePath $filePath -Encoding UTF8
    Write-Host "Created file: $file" -ForegroundColor Green
}

Write-Host "`nProject structure created successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy .env.example to .env and configure" -ForegroundColor White
Write-Host "2. Run: npm install" -ForegroundColor White
Write-Host "3. Start MongoDB" -ForegroundColor White
Write-Host "4. Run: npm start" -ForegroundColor White

Write-Host "`nProject location: $ProjectPath" -ForegroundColor Cyan
