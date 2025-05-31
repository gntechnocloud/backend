# Create environment configuration
env_content = """# Fortunity NXT Backend Environment Configuration

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fortunity_nxt
REDIS_URL=redis://localhost:6379

# Blockchain Configuration
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
PRIVATE_KEY=your_private_key_here
CHAIN_ID=1

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Admin Configuration
ADMIN_WALLET_ADDRESS=0xAdminWalletAddress
TREASURY_ADDRESS=0xTreasuryWalletAddress

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Pool Distribution
POOL_DISTRIBUTION_DAYS=5,15,25

# Notification Settings
WEBHOOK_URL=https://your-webhook-url.com/notify
"""

with open('.env.example', 'w') as f:
    f.write(env_content)

print("✅ Environment configuration created!")
``````python
# Create environment configuration
env_content = """# Fortunity NXT Backend Environment Configuration

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fortunity_nxt
REDIS_URL=redis://localhost:6379

# Blockchain Configuration
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
PRIVATE_KEY=your_private_key_here
CHAIN_ID=1

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Admin Configuration
ADMIN_WALLET_ADDRESS=0xAdminWalletAddress
TREASURY_ADDRESS=0xTreasuryWalletAddress

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Pool Distribution
POOL_DISTRIBUTION_DAYS=5,15,25

# Notification Settings
WEBHOOK_URL=https://your-webhook-url.com/notify
"""

with open('.env.example', 'w') as f:
    f.write(env_content)

print("✅ Environment configuration created!")