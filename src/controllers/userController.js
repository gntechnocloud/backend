const { ethers } = require("ethers");
const User = require("../models/User");
const Income = require("../models/Income");
const Slot = require("../models/Slot");
const Transaction = require("../models/Transaction");
const diamondAbi = require("../abi/diamondAbi.json");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, diamondAbi, provider);

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId)
      .populate('referredBy', 'username walletAddress')
      .populate('directReferrals', 'username walletAddress');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
}

async function getEarnings(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.totalEarnings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch earnings', error: error.message });
  }
}

async function getReferralTree(req, res) {
  try {
    const user = await User.findById(req.user.userId).populate('directReferrals');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tree = {
      user: user.username,
      referrals: []
    };

    for (const ref of user.directReferrals) {
      const subUser = await User.findById(ref._id).populate('directReferrals');
      tree.referrals.push({
        user: subUser.username,
        referrals: subUser.directReferrals.map(u => u.username)
      });
    }

    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch referral tree', error: error.message });
  }
}

async function getSlotStatus(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.activeSlots);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch slot status', error: error.message });
  }
}

async function getIncomeHistory(req, res) {
  try {
    const incomes = await Income.find({ user: req.user.userId }).sort({ createdAt: -1 }).limit(100);
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch income history', error: error.message });
  }
}

async function getUserByWallet(req, res) {
  const wallet = req.params.wallet.toLowerCase();

  try {
    const user = await User.findOne({ address: wallet });
    const slots = await Slot.find({ address: wallet }).sort({ slotId: 1 });
    const transactions = await Transaction.find({
      $or: [{ from: wallet }, { to: wallet }],
    }).sort({ timestamp: -1 });

    const isRegistered = await contract.isUserExists(wallet);
    const referrer = await contract.getReferrer(wallet);

    res.json({
      address: wallet,
      isRegistered,
      referrer,
      user,
      slots,
      transactions,
    });
  } catch (err) {
    console.error("❌ Error in getUserByWallet:", err);
    res.status(500).json({ message: "Error fetching user data" });
  }
}

module.exports = {
  getProfile,
  getEarnings,
  getReferralTree,
  getSlotStatus,
  getIncomeHistory,
  getUserByWallet
};
// This code is part of a user controller for a Node.js application that interacts with a blockchain-based contract.
// It provides various endpoints to fetch user profile, earnings, referral tree, slot status, income history, and user data by wallet address.
// It uses Mongoose for MongoDB interactions and Ethers.js for blockchain interactions.
//
// The controller includes error handling and populates related user data such as referrals and slots.
//     global.server = app.listen(process.env.PORT || 3000, () => {
//       logger.info(`Server is running on port ${process.env.PORT || 3000}`);
//     });
//     global.server = server;
//     });
//   } catch (error) {
//     logger.error('Error starting server:', error);
//     process.exit(1);
//   }
//
//