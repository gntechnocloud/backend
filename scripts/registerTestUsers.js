require("dotenv").config();
const { ethers } = require("ethers");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Slot = require("../src/models/Slot");
const unifiedDiamondAbi = require("../src/abi/unifiedDiamondAbi.json");

// Constants
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const funder = new ethers.Wallet(process.env.PRIVATE_KEY.replace(/'/g, ""), provider);
const diamondAddress = process.env.DIAMOND_ADDRESS.replace(/'/g, "");
const diamond = new ethers.Contract(diamondAddress, unifiedDiamondAbi, funder);

const TOTAL_USERS = 102;
const START_SLOT = 1;
const MAX_SLOT = 7;

async function connectToMongo() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");
}

async function fundWallets(wallets) {
  let nonce = await provider.getTransactionCount(funder.address);

  for (const [index, wallet] of wallets.entries()) {
    try {
      const tx = await funder.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther("1"),
        nonce: nonce++
      });

      await tx.wait();
      console.log(`💸 Funded wallet P${index}: ${wallet.address}`);
    } catch (err) {
      console.error(`❌ Failed to fund P${index}: ${err.message}`);
    }
  }

  console.log("✅ All wallets funded");
}

async function registerUsers(wallets) {
  for (let i = 0; i < wallets.length; i++) {
    const referrer = i === 0 ? funder.address : wallets[i - 1].address;
    const slot = Math.floor(Math.random() * (MAX_SLOT - START_SLOT + 1)) + START_SLOT;

    const userWallet = wallets[i];
    const userSigner = new ethers.Wallet(userWallet.privateKey, provider);
    const userDiamond = diamond.connect(userSigner);

    try {
      const tx = await userDiamond.register(referrer, {
        gasLimit: 1_000_000
      });
      await tx.wait();

      console.log(`📝 Registered P${i} | Referrer: ${referrer} | Slot: ${slot}`);

      const newUser = await User.create({
        walletAddress: userWallet.address.toLowerCase(),
        referredBy: referrer.toLowerCase(),
        username: `P${i}`,
        activeSlots: [slot], // slot tracking is still stored off-chain
      });

      await Slot.create({
        user: newUser._id,
        address: userWallet.address.toLowerCase(),
        slotId: slot,
        isActive: true
      });
    } catch (err) {
      console.error(`❌ Failed to register P${i}: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("✅ All users registered and synced to MongoDB");
}

async function main() {
  await connectToMongo();

  const wallets = Array.from({ length: TOTAL_USERS }, () => ethers.Wallet.createRandom());

  await fundWallets(wallets);
  await registerUsers(wallets);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
// This script registers test users in the Fortunity NXT system, funding their wallets and creating user records in MongoDB.
// It connects to a local Ethereum node, funds user wallets, and registers them with a smart contract.  