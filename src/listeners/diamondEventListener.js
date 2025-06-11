// src/listeners/diamondEventListener.js

const ethers = require('ethers');
const dotenv = require('dotenv');
const PQueue = require('p-queue').default;

const User = require('../models/User');
const Slot = require('../models/Slot');
const Income = require('../models/Income');
const Transaction = require('../models/Transaction');

const { info, warn, error: logError } = require('../utils/logger');
const diamondAbi = require('../abi/diamondAbi.json').abi; // ABI from Hardhat compile
const { sendEmail, sendWebhook } = require('../utils/notifier');

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const diamondContract = new ethers.Contract(process.env.DIAMOND_ADDRESS, diamondAbi, provider);

// Notification queue with concurrency limit of 2
const notificationQueue = new PQueue({ concurrency: 2 });

// Helper: safely parse integers
function safeParseInt(value) {
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

// Helper: get gasUsed from event receipt (async)
async function getGasUsed(event) {
  try {
    if (event && event.getTransactionReceipt) {
      const receipt = await event.getTransactionReceipt();
      return receipt.gasUsed ? receipt.gasUsed.toString() : null;
    }
  } catch (e) {
    warn(`Failed to fetch gasUsed for tx ${event.transactionHash}: ${e.message}`);
  }
  return null;
}

// Main initializer for event listeners
async function initDiamondEventListeners() {
  info('Initializing Diamond Contract Event Listeners...');

  // User Registered Event
  diamondContract.on('UserRegistered', async (walletAddress, username, referralCode, event) => {
    try {
      const lowerAddress = walletAddress.toLowerCase();
      let user = await User.findOne({ walletAddress: lowerAddress });
      if (!user) {
        user = new User({
          walletAddress: lowerAddress,
          username,
          email: `${username}@example.com`,
          referralCode: User.prototype.generateReferralCode()
        });
        await user.save();
        info(`User ${walletAddress} registered.`);
      } else {
        info(`User ${walletAddress} already exists.`);
      }
    } catch (err) {
      logError('Error in UserRegistered:', err);
    }
  });

  // Slot Purchased Event
  diamondContract.on('SlotPurchased', async (userAddress, slotNumberRaw, event) => {
    try {
      const slotNumber = safeParseInt(slotNumberRaw);
      if (slotNumber === null) {
        warn(`SlotPurchased: Invalid slotNumber: ${slotNumberRaw}`);
        return;
      }

      const userAddressLower = userAddress.toLowerCase();

      const user = await User.findOne({ walletAddress: userAddressLower });
      if (!user) {
        warn(`SlotPurchased: User not found: ${userAddress}`);
        return;
      }

      // Atomically increment purchaseCount and update lastPurchaseDate
      await Slot.updateOne(
        { slotNumber },
        { 
          $inc: { purchaseCount: 1 }, 
          $set: { lastPurchaseDate: new Date() }
        }
      );

      // Add slotNumber to user's activatedSlots array (avoid duplicates)
      await User.updateOne(
        { walletAddress: userAddressLower },
        { $addToSet: { activatedSlots: slotNumber } }
      );

      const gasUsed = await getGasUsed(event);

      await Transaction.create({
        transactionHash: event.transactionHash,
        fromAddress: userAddress,
        toAddress: process.env.DIAMOND_ADDRESS,
        amount: user.slotsPriceMap?.[slotNumber] || 0,
        transactionType: 'purchase',
        relatedUser: user._id,
        description: `Slot ${slotNumber} purchased`,
        blockNumber: event.blockNumber,
        gasUsed
      });

      info(`Slot ${slotNumber} purchased by ${userAddress}`);
    } catch (err) {
      logError('Error in SlotPurchased:', err);
    }
  });

  // Matrix Income Paid Event
  diamondContract.on('MatrixIncomePaid', async (sender, receiver, slotNumberRaw, amountRaw, event) => {
    try {
      const slotNumber = safeParseInt(slotNumberRaw);
      const amount = parseFloat(amountRaw);
      if (slotNumber === null || isNaN(amount)) {
        warn(`MatrixIncomePaid: Invalid data - slotNumber: ${slotNumberRaw}, amount: ${amountRaw}`);
        return;
      }

      const receiverLower = receiver.toLowerCase();

      const user = await User.findOne({ walletAddress: receiverLower });
      if (!user) {
        warn(`MatrixIncomePaid: Receiver not found: ${receiver}`);
        return;
      }

      // Atomic increment of matrixIncome earnings
      await User.updateOne(
        { walletAddress: receiverLower },
        { $inc: { 'earnings.matrixIncome': amount } }
      );

      const senderUser = await User.findOne({ walletAddress: sender.toLowerCase() });

      await Income.create({
        user: user._id,
        incomeType: 'matrix',
        amount,
        description: `Matrix income from slot ${slotNumber}`,
        transactionHash: event.transactionHash,
        relatedUser: senderUser ? senderUser._id : null,
        slotNumber
      });

      await Transaction.create({
        transactionHash: event.transactionHash,
        fromAddress: process.env.DIAMOND_ADDRESS,
        toAddress: receiver,
        amount,
        transactionType: 'income',
        relatedUser: user._id,
        description: `Matrix income from slot ${slotNumber}`,
        blockNumber: event.blockNumber,
        gasUsed: await getGasUsed(event)
      });

      info(`Matrix income paid to ${receiver} for slot ${slotNumber}`);

      // Enqueue notifications
      notificationQueue.add(() =>
        sendEmail({
          to: user.email,
          subject: `You've received Matrix Income!`,
          text: `Hi ${user.username}, you received ${amount} CORE in slot ${slotNumber}.`,
          html: `<strong>Hi ${user.username}</strong>,<br/>You received <b>${amount}</b> CORE in slot ${slotNumber}.`
        }).catch(e => warn(`Failed to send MatrixIncomePaid email: ${e.message}`))
      );

      notificationQueue.add(() =>
        sendWebhook({
          event: 'MatrixIncomePaid',
          user: user.walletAddress,
          slotNumber,
          amount,
          timestamp: new Date(),
        }).catch(e => warn(`Failed to send MatrixIncomePaid webhook: ${e.message}`))
      );

    } catch (err) {
      logError('Error in MatrixIncomePaid:', err);
    }
  });

  // Level Income Paid Event
  diamondContract.on('LevelIncomePaid', async (sender, receiver, levelNumberRaw, amountRaw, event) => {
    try {
      const levelNumber = safeParseInt(levelNumberRaw);
      const amount = parseFloat(amountRaw);
      if (levelNumber === null || isNaN(amount)) {
        warn(`LevelIncomePaid: Invalid data - levelNumber: ${levelNumberRaw}, amount: ${amountRaw}`);
        return;
      }

      const receiverLower = receiver.toLowerCase();
      const user = await User.findOne({ walletAddress: receiverLower });
      if (!user) {
        warn(`LevelIncomePaid: Receiver not found: ${receiver}`);
        return;
      }

      await User.updateOne(
        { walletAddress: receiverLower },
        { $inc: { 'earnings.levelIncome': amount } }
      );

      const senderUser = await User.findOne({ walletAddress: sender.toLowerCase() });

      await Income.create({
        user: user._id,
        incomeType: 'level',
        amount,
        description: `Level income from level ${levelNumber}`,
        transactionHash: event.transactionHash,
        relatedUser: senderUser ? senderUser._id : null,
        levelNumber
      });

      await Transaction.create({
        transactionHash: event.transactionHash,
        fromAddress: process.env.DIAMOND_ADDRESS,
        toAddress: receiver,
        amount,
        transactionType: 'income',
        relatedUser: user._id,
        description: `Level income from level ${levelNumber}`,
        blockNumber: event.blockNumber,
        gasUsed: await getGasUsed(event)
      });

      info(`Level income paid to ${receiver} for level ${levelNumber}`);

    } catch (err) {
      logError('Error in LevelIncomePaid:', err);
    }
  });

  // Pool Income Paid Event
  diamondContract.on('PoolIncomePaid', async (receiver, amountRaw, event) => {
    try {
      const amount = parseFloat(amountRaw);
      if (isNaN(amount)) {
        warn(`PoolIncomePaid: Invalid amount: ${amountRaw}`);
        return;
      }

      const receiverLower = receiver.toLowerCase();
      const user = await User.findOne({ walletAddress: receiverLower });
      if (!user) {
        warn(`PoolIncomePaid: Receiver not found: ${receiver}`);
        return;
      }

      await User.updateOne(
        { walletAddress: receiverLower },
        { $inc: { 'earnings.poolIncome': amount } }
      );

      await Income.create({
        user: user._id,
        incomeType: 'pool',
        amount,
        description: `Pool income`,
        transactionHash: event.transactionHash
      });

      await Transaction.create({
        transactionHash: event.transactionHash,
        fromAddress: process.env.DIAMOND_ADDRESS,
        toAddress: receiver,
        amount,
        transactionType: 'income',
        relatedUser: user._id,
        description: 'Pool income',
        blockNumber: event.blockNumber,
        gasUsed: await getGasUsed(event)
      });

      info(`Pool income paid to ${receiver}`);

    } catch (err) {
      logError('Error in PoolIncomePaid:', err);
    }
  });

  // Rebirth Event
  diamondContract.on('Rebirth', async (userAddress, slotNumberRaw, event) => {
    try {
      const slotNumber = safeParseInt(slotNumberRaw);
      if (slotNumber === null) {
        warn(`Rebirth: Invalid slotNumber: ${slotNumberRaw}`);
        return;
      }

      const userAddressLower = userAddress.toLowerCase();

      const user = await User.findOne({ walletAddress: userAddressLower });
      if (!user) {
        warn(`Rebirth: User not found: ${userAddress}`);
        return;
      }

      if (typeof user.processRebirth === 'function') {
        user.processRebirth(slotNumber);
        await user.save();
      } else {
        warn(`Rebirth: user.processRebirth method not found for ${userAddress}`);
      }

      const slot = await Slot.findOne({ slotNumber });

      const gasUsed = await getGasUsed(event);

      await Transaction.create({
        transactionHash: event.transactionHash,
        fromAddress: userAddress,
        toAddress: process.env.DIAMOND_ADDRESS,
        amount: slot ? slot.price : 0,
        transactionType: 'rebirth',
        relatedUser: user._id,
        description: `Rebirth on slot ${slotNumber}`,
        blockNumber: event.blockNumber,
        gasUsed
      });

      info(`Rebirth processed for ${userAddress} on slot ${slotNumber}`);

    } catch (err) {
      logError('Error in Rebirth:', err);
    }
  });

  // Admin Fee Paid Event
  diamondContract.on('AdminFeePaid', async (receiver, amountRaw, event) => {
    try {
      const amount = parseFloat(amountRaw);
      if (isNaN(amount)) {
        warn(`AdminFeePaid: Invalid amount: ${amountRaw}`);
        return;
      }

      const receiverLower = receiver.toLowerCase();
      const user = await User.findOne({ walletAddress: receiverLower });
      if (!user) {
        warn(`AdminFeePaid: Receiver not found: ${receiver}`);
        return;
      }

      const gasUsed = await getGasUsed(event);

      await Transaction.create({
        transactionHash: event.transactionHash,
        fromAddress: process.env.DIAMOND_ADDRESS,
        toAddress: receiver,
        amount,
        transactionType: 'adminFee',
        relatedUser: user._id,
        description: 'Admin fee payment',
        blockNumber: event.blockNumber,
        gasUsed
      });

      info(`Admin fee paid to ${receiver}`);

    } catch (err) {
      logError('Error in AdminFeePaid:', err);
    }
  });
}

module.exports = {
  initDiamondEventListeners
};
// This module initializes event listeners for the Diamond contract.
// It listens for various events like UserRegistered, SlotPurchased, MatrixIncomePaid, etc. 