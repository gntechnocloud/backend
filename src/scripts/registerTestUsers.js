const mongoose = require('mongoose');
const { ethers } = require('ethers');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Slot = require('../src/models/Slot');
const diamondAbi = require('../src/abi/diamondAbi.json');

dotenv.config();

// Hardhat Local Network
const provider = new ethers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.DIAMOND_ADDRESS, diamondAbi, signer);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fortunity_nxt';

function getRandomSlot() {
  return Math.floor(Math.random() * 7) + 1; // Slots 1 to 7
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
}

async function registerUsers() {
  try {
    const accounts = await provider.listAccounts();
    if (accounts.length < 103) throw new Error('Need at least 103 test accounts from Hardhat');

    console.log('🌐 Found', accounts.length, 'accounts');

    for (let i = 0; i < 102; i++) {
      const wallet = accounts[i];
      const referrer = i === 0 ? ethers.ZeroAddress : accounts[i - 1];
      const randomSlot = getRandomSlot();

      console.log(`📥 Registering P${i} (${wallet}) with referrer ${referrer} and Slot ${randomSlot}`);

      try {
        const tx = await contract.register(referrer, {
          from: wallet,
          gasLimit: 3000000,
        });
        await tx.wait();

        // Save to MongoDB
        const user = new User({
          walletAddress: wallet,
          username: `P${i}`,
          referredBy: i === 0 ? null : accounts[i - 1],
          activeSlots: [randomSlot],
        });
        await user.save();

        const slot = new Slot({
          address: wallet,
          slotId: randomSlot,
          isActive: true,
        });
        await slot.save();

        console.log(`✅ Registered P${i} - Slot ${randomSlot}`);
      } catch (err) {
        console.error(`❌ Failed to register P${i}:`, err.message);
      }
    }
  } catch (err) {
    console.error('🚫 Registration failed:', err);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

(async () => {
  await connectDB();
  await registerUsers();
})();
// This script registers 102 test users with random slots and saves them to MongoDB.
// It assumes you have a Hardhat local network running with at least 103 accounts.  