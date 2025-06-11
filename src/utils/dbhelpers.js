// src/utils/dbHelpers.js

import Transaction from '../models/Transaction.js';
import Income from '../models/Income.js';
import { error as logError } from './logger.js';

export async function createTransactionEntry({
  txHash,
  from,
  to,
  amount,
  type,
  userId,
  description,
  block,
  gas
}) {
  try {
    await Transaction.create({
      transactionHash: txHash,
      fromAddress: from,
      toAddress: to,
      amount,
      transactionType: type,
      relatedUser: userId,
      description,
      blockNumber: block,
      gasUsed: gas
    });
  } catch (err) {
    logError(`createTransactionEntry failed: ${description}`, err);
  }
}

export async function createIncomeEntry({
  userId,
  type,
  amount,
  txHash,
  relatedUserId = null,
  description,
  slotNumber = null,
  levelNumber = null
}) {
  try {
    await Income.create({
      user: userId,
      incomeType: type,
      amount,
      description,
      transactionHash: txHash,
      relatedUser: relatedUserId,
      slotNumber,
      levelNumber
    });
  } catch (err) {
    logError(`createIncomeEntry failed: ${description}`, err);
  }
}
export async function addEarnings(userId, type, amount) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    user.earnings[type] = (user.earnings[type] || 0) + parseFloat(amount);
    await user.save();
  } catch (err) {
    logError(`addEarnings failed for user ${userId}`, err);
  }
}   
export async function findUserByWalletAddress(walletAddress) {
  try {
    return await User.findOne({ walletAddress: walletAddress.toLowerCase() });
  } catch (err) {
    logError(`findUserByWalletAddress failed for ${walletAddress}`, err);
    return null;
  }
}
export async function processRebirth(userId, slotNumber) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    user.processRebirth(parseInt(slotNumber));
    await user.save();
  } catch (err) {
    logError(`processRebirth failed for user ${userId}`, err);
  }
}
import User from '../models/User.js';
export async function addEarningsToUser(walletAddress, type, amount) {
  try {
    const user = await findUserByWalletAddress(walletAddress);
    if (!user) throw new Error(`User not found: ${walletAddress}`);

    user.addEarnings(type, parseFloat(amount));
    await user.save();
  } catch (err) {
    logError(`addEarningsToUser failed for ${walletAddress}`, err);
  }
}
