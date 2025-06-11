# Fortunity NXT Backend API

## Project Overview

Fortunity NXT is a crypto-based Semi-DAPP that implements a 2x2 Forced Matrix MLM structure. This backend API powers the platform by managing user accounts, tracking earnings, handling transactions, and integrating with the blockchain for real-time updates.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **User Management:** Registration, login, profile management, and referral tracking.
- **Earnings Tracking:** Matrix, level, pool incomes, and total earnings.
- **Transaction Handling:** Record and track all user transactions.
- **Slot Management:** Purchase, activate, and monitor slot statuses.
- **Blockchain Integration:** Real-time event listening from smart contracts.
- **Security:** JWT authentication, rate limiting, CORS, and Helmet.
- **Scalability:** Load balancing and optimized database queries.
- **Logging:** Winston-based logging for monitoring and debugging.
- **Docker Support:** Dockerfile and docker-compose for easy deployment.

---

## Architecture

- **RESTful API:** Built with Express.js for robust routing and middleware support.
- **Database Layer:** MongoDB with Mongoose for schema modeling.
- **Blockchain Layer:** Web3.js for Ethereum smart contract interactions.
- **Authentication:** JWT for secure, stateless authentication.
- **Containerization:** Docker for consistent deployment across environments.

---

## Technologies Used

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ORM
- **Web3.js**: Ethereum blockchain API
- **JWT**: Authentication
- **Bcrypt**: Password hashing
- **Cors**: Cross-Origin Resource Sharing
- **Helmet**: Security middleware
- **RateLimit**: API rate limiting
- **Winston**: Logging
- **Dotenv**: Environment variable management
- **Docker**: Containerization

---

## Prerequisites

- **Node.js**: v16 or higher
- **npm**: v7 or higher
- **MongoDB**: v4.4 or higher
- **Git**: Version control
- **Docker**: (Optional) For containerized deployment

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd fortunity-dapp/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and update values as needed.

---

## Configuration

Edit the `.env` file to set your environment variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fortunity
JWT_SECRET=your_jwt_secret
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/your_project_id
SMART_CONTRACT_ADDRESS=0xYourContractAddress
```

---

## Running the Application

- **Development:**
  ```bash
  npm run dev
  ```

- **Production:**
  ```bash
  npm start
  ```

- **With Docker:**
  ```bash
  docker-compose up --build
  ```

---

## API Endpoints

| Method | Endpoint                | Description                      | Auth Required |
|--------|-------------------------|----------------------------------|--------------|
| POST   | `/api/auth/register`    | Register a new user              | No           |
| POST   | `/api/auth/login`       | User login                       | No           |
| GET    | `/api/users/profile`    | Get user profile                 | Yes          |
| GET    | `/api/earnings`         | Get user earnings                | Yes          |
| POST   | `/api/slots/purchase`   | Purchase a new slot              | Yes          |
| GET    | `/api/transactions`     | List user transactions           | Yes          |
| ...    | ...                     | ...                              | ...          |

> **Note:** See the [API documentation](docs/API.md) for detailed request/response formats.

---

## Testing

- **Run tests:**
  ```bash
  npm test
  ```

- **Test coverage:**
  ```bash
  npm run coverage
  ```

---

## Security

- **Authentication:** JWT tokens for all protected routes.
- **Password Hashing:** Bcrypt for secure password storage.
- **Rate Limiting:** Prevents brute-force attacks.
- **CORS & Helmet:** Protects against common web vulnerabilities.

---

## Deployment

- **Docker Compose:** Use `docker-compose up` for multi-container deployment.
- **Environment Variables:** Ensure all secrets are set in production.
- **Scaling:** Use process managers (e.g., PM2) and load balancers for scaling.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Contact

For support or business inquiries, please contact [support@fortunity.com](mailto:support@fortunity.com).