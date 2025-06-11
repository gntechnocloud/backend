const { ethers } = require('ethers');
const User = require('../models/User');
const Slot = require('../models/Slot');
const Transaction = require('../models/Transaction');
const Income = require('../models/Income');
const { info, error, warn } = require('../utils/logger');

// Load environment variables for provider and contract info
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;

// ABI of your deployed contract (simplified example)
const contractABI = [
  // Add event signatures you want to listen to
  "event UserRegistered(address indexed walletAddress, string username, string referralCode)",
  "event SlotPurchased(address indexed userAddress, uint256 slotNumber, uint256 price)",
  "event UserRegistered(address walletAddress, string username, string referralCode)",
  "event SlotPurchased(address userAddress, uint256 slotNumber, uint256 price)",
  "event MatrixIncomePaid(address sender, address receiver, uint256 slotNumber, uint256 amount)",
  "event ReferralIncomePaid(address referrer, address referee, uint256 amount)",
  "event SystemIncomePaid(address indexed receiver, uint256 amount)",
  "event SlotActivated(address indexed userAddress, uint256 slotNumber)",
  "event SlotDeactivated(address indexed userAddress, uint256 slotNumber)",
  "event UserUpdated(address indexed walletAddress, string username, string referralCode)",
  "event UserDeleted(address indexed walletAddress)",
  "event SlotUpdated(uint256 slotNumber, string slotName, uint256 price, uint256 maxPurchases)",
  "event SlotDeleted(uint256 slotNumber)",
  "event TransactionRecorded(string transactionHash, address fromAddress, address toAddress, uint256 amount, string transactionType, address relatedUser, string description, uint256 blockNumber, uint256 gasUsed)",
  "event IncomeRecorded(address indexed userAddress, uint256 amount, string incomeType, uint256 timestamp)"
  // Add other events similarly...
];

const contract = new ethers.Contract(contractAddress, contractABI, provider);

class BlockchainListener {

  constructor() {
    this.initListeners();
  }

  initListeners() {
    // UserRegistered event
    contract.on("UserRegistered", async (walletAddress, username, referralCode, event) => {
      info(`UserRegistered event received for ${walletAddress}`);
      try {
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (!user) {
          user = new User({
            walletAddress: walletAddress.toLowerCase(),
            username,
            referralCode,
            email: `${username}@example.com`,
          });
          await user.save();
          info(`User ${walletAddress} saved.`);
        } else {
          info(`User ${walletAddress} already exists.`);
        }
      } catch (err) {
        error('Error handling UserRegistered event:', err);
      }
    });

    // SlotPurchased event
    contract.on("SlotPurchased", async (userAddress, slotNumber, price, event) => {
      info(`SlotPurchased event received for ${userAddress}, slot ${slotNumber}`);
      try {
        const user = await User.findOne({ walletAddress: userAddress.toLowerCase() });
        if (!user) {
          warn(`User ${userAddress} not found.`);
          return;
        }

        const slot = await Slot.findOne({ slotNumber: slotNumber.toNumber() });
        if (!slot) {
          warn(`Slot ${slotNumber} not found.`);
          return;
        }

        user.activateSlot(slotNumber.toNumber());
        slot.purchaseCount += 1;
        slot.lastPurchaseDate = new Date();
        await slot.save();
        await user.save();

        const transaction = new Transaction({
          transactionHash: event.transactionHash,
          fromAddress: userAddress,
          toAddress: contractAddress,
          amount: price,
          transactionType: 'purchase',
          relatedUser: user._id,
          description: `Slot ${slotNumber} purchased`,
          blockNumber: event.blockNumber,
          gasUsed: event.gasUsed
        });
        await transaction.save();

        info(`Slot ${slotNumber} purchased by ${userAddress} recorded.`);
      } catch (err) {
        error('Error handling SlotPurchased event:', err);
      }
    });

    // MatrixIncomePaid event
    contract.on("MatrixIncomePaid", async (sender, receiver, slotNumber, amount, event) => {
      info(`MatrixIncomePaid event received from ${sender} to ${receiver} for slot ${slotNumber}`);
      try {
        const income = new Income({
          userAddress: receiver.toLowerCase(),
          amount: amount.toString(),
          incomeType: 'matrix',
          timestamp: new Date(event.blockTimestamp * 1000)
        });
        await income.save();
        info(`Matrix income of ${amount} recorded for ${receiver}`);
      } catch (err) {
        error('Error handling MatrixIncomePaid event:', err);
      }
    });

    // ReferralIncomePaid event
    contract.on("ReferralIncomePaid", async (referrer, referee, amount, event) => {
      info(`ReferralIncomePaid event received from ${referrer} to ${referee}`);
      try {
        const income = new Income({
          userAddress: referrer.toLowerCase(),
          amount: amount.toString(),
          incomeType: 'referral',
          timestamp: new Date(event.blockTimestamp * 1000)
        });
        await income.save();
        info(`Referral income of ${amount} recorded for ${referrer}`);
      } catch (err) {
        error('Error handling ReferralIncomePaid event:', err);
      }
    });

    // SystemIncomePaid event
    contract.on("SystemIncomePaid", async (receiver, amount, event) => {
      info(`SystemIncomePaid event received for ${receiver}`);
      try {
        const income = new Income({
          userAddress: receiver.toLowerCase(),
          amount: amount.toString(),
          incomeType: 'system',
          timestamp: new Date(event.blockTimestamp * 1000)
        });
        await income.save();
        info(`System income of ${amount} recorded for ${receiver}`);
      } catch (err) {
        error('Error handling SystemIncomePaid event:', err);
      }
    });

    // SlotActivated event
    contract.on("SlotActivated", async (userAddress, slotNumber, event) => {
      info(`SlotActivated event received for ${userAddress}, slot ${slotNumber}`);
      try {
        const user = await User.findOne({ walletAddress: userAddress.toLowerCase() });
        if (!user) {
          warn(`User ${userAddress} not found.`);
          return;
        }
        user.activateSlot(slotNumber.toNumber());
        await user.save();
        info(`Slot ${slotNumber} activated for ${userAddress}`);
      } catch (err) {
        error('Error handling SlotActivated event:', err);
      }
    });

    // SlotDeactivated event
    contract.on("SlotDeactivated", async (userAddress, slotNumber, event) => {
      info(`SlotDeactivated event received for ${userAddress}, slot ${slotNumber}`);
      try {
        const user = await User.findOne({ walletAddress: userAddress.toLowerCase() });
        if (!user) {
          warn(`User ${userAddress} not found.`);
          return;
        }
        user.deactivateSlot(slotNumber.toNumber());
        await user.save();
        info(`Slot ${slotNumber} deactivated for ${userAddress}`);
      } catch (err) {
        error('Error handling SlotDeactivated event:', err);
      }
    });

    // UserUpdated event
    contract.on("UserUpdated", async (walletAddress, username, referralCode, event) => {
      info(`UserUpdated event received for ${walletAddress}`);
      try {
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (user) {
          user.username = username;
          user.referralCode = referralCode;
          await user.save();
          info(`User ${walletAddress} updated.`);
        } else {
          warn(`User ${walletAddress} not found.`);
        }
      } catch (err) {
        error('Error handling UserUpdated event:', err);
      }
    });

    // UserDeleted event
    contract.on("UserDeleted", async (walletAddress, event) => {
      info(`UserDeleted event received for ${walletAddress}`);
      try {
        const user = await User.findOneAndDelete({ walletAddress: walletAddress.toLowerCase() });
        if (user) {
          info(`User ${walletAddress} deleted.`);
        } else {
          warn(`User ${walletAddress} not found.`);
        }
      } catch (err) {
        error('Error handling UserDeleted event:', err);
      }
    });

    // SlotUpdated event
    contract.on("SlotUpdated", async (slotNumber, slotName, price, maxPurchases, event) => {
      info(`SlotUpdated event received for slot ${slotNumber}`);
      try {
        let slot = await Slot.findOne({ slotNumber: slotNumber.toNumber() });
        if (slot) {
          slot.slotName = slotName;
          slot.price = price.toString();
          slot.maxPurchases = maxPurchases.toNumber();
          await slot.save();
          info(`Slot ${slotNumber} updated.`);
        } else {
          warn(`Slot ${slotNumber} not found.`);
        }
      } catch (err) {
        error('Error handling SlotUpdated event:', err);
      }
    });

    // SlotDeleted event
    contract.on("SlotDeleted", async (slotNumber, event) => {
      info(`SlotDeleted event received for slot ${slotNumber}`);
      try {
        const slot = await Slot.findOneAndDelete({ slotNumber: slotNumber.toNumber() });
        if (slot) {
          info(`Slot ${slotNumber} deleted.`);
        } else {
          warn(`Slot ${slotNumber} not found.`);
        }
      } catch (err) {
        error('Error handling SlotDeleted event:', err);
      }
    });

    // TransactionRecorded event    
    contract.on("TransactionRecorded", async (transactionHash, fromAddress, toAddress, amount, transactionType, relatedUser, description, blockNumber, gasUsed, event) => {
      info(`TransactionRecorded event received: ${transactionHash}`);
      try {
        const transaction = new Transaction({
          transactionHash,
          fromAddress: fromAddress.toLowerCase(),
          toAddress: toAddress.toLowerCase(),
          amount: amount.toString(),
          transactionType,
          relatedUser,
          description,
          blockNumber,
          gasUsed
        });
        await transaction.save();
        info(`Transaction ${transactionHash} recorded.`);
      } catch (err) {
        error('Error handling TransactionRecorded event:', err);
      }
    });

    // IncomeRecorded event
    contract.on("IncomeRecorded", async (userAddress, amount, incomeType, timestamp, event) => {
      info(`IncomeRecorded event received for ${userAddress}`);
      try {
        const income = new Income({
          userAddress: userAddress.toLowerCase(),
          amount: amount.toString(),
          incomeType,
          timestamp: new Date(timestamp * 1000) // Convert from seconds to milliseconds
        });
        await income.save();
        info(`Income of ${amount} recorded for ${userAddress}`);
      } catch (err) {
        error('Error handling IncomeRecorded event:', err);
      }
    });
  } // Closing initListeners method
}

module.exports = new BlockchainListener();
// This code listens to blockchain events and updates the database accordingly.
// It handles user registration, slot purchases, income payments, and more. 