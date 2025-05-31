# Fortunity NXT Backend API

## Project Overview

Fortunity NXT is a crypto-based Semi-DAPP using a 2x2 Forced Matrix MLM structure. This backend API provides the necessary endpoints and services to manage user accounts, track earnings, handle transactions, and interact with the blockchain.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Management**: Registration, login, profile management, referral tracking.
- **Earnings Tracking**: Matrix income, level income, pool income, total earnings.
- **Transaction Handling**: Recording and tracking of all transactions.
- **Slot Management**: Purchase, activation, and status tracking of slots.
- **Blockchain Integration**: Event listener for real-time updates from the smart contract.
- **Security**: JWT authentication, rate limiting, CORS, and Helmet for enhanced security.
- **Scalability**: Designed for scalability with load balancing and database optimization.
- **Logging**: Comprehensive logging using Winston for monitoring and debugging.
- **Docker Support**: Dockerfile and docker-compose files for easy deployment.

## Technologies Used

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web application framework.
- **MongoDB**: NoSQL database.
- **Mongoose**: MongoDB object modeling tool.
- **Web3.js**: Ethereum JavaScript API.
- **JWT**: JSON Web Tokens for authentication.
- **Bcrypt**: Password hashing.
- **Cors**: Cross-Origin Resource Sharing.
- **Helmet**: Security middleware.
- **RateLimit**: Rate limiting middleware.
- **Winston**: Logging library.
- **Dotenv**: Load environment variables from `.env` file.
- **Docker**: Containerization platform.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: v16 or higher
- **npm**: v7 or higher
- **MongoDB**: v4.4 or higher
- **Git**: For version control
- **Docker**: Optional, for containerized deployment

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd fortunity-nxt-backend