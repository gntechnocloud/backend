const Reown = require('@reown/sdk');
const User = require('../models/User'); // Import User model
const Slot = require('../models/Slot'); // Import Slot model
const Transaction = require('../models/Transaction'); // Import Transaction model
const Income = require('../models/Income'); // Import Income model
const logger = require('../utils/logger'); // Import logger

class ReownService {
    constructor() {
        this.reown = new Reown({
            projectId: process.env.REOWN_PROJECT_ID,
            apiKey: process.env.REOWN_API_KEY,
            // Add other config options if needed
        });
    }

    // Initialize event listeners
    initEventListeners() {
        this.reown.events.on('UserRegistered', async (event) => {
            const { walletAddress, username, referralCode } = event.data;
            logger.info(`Handling UserRegistered event for ${walletAddress}`);

            try {
                let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
                if (!user) {
                    user = new User({
                        walletAddress: walletAddress.toLowerCase(),
                        username,
                        email: `${username}@example.com`, // Dummy email
                        referralCode: User.prototype.generateReferralCode()
                    });
                    await user.save();
                    logger.info(`User ${walletAddress} registered successfully.`);
                } else {
                    logger.info(`User ${walletAddress} already registered.`);
                }
            } catch (error) {
                logger.error('Error handling UserRegistered event:', error);
            }
        });

        this.reown.events.on('SlotPurchased', async (event) => {
            const { userAddress, slotNumber } = event.data;
            logger.info(`Handling SlotPurchased event for ${userAddress}, slot ${slotNumber}`);

            try {
                let user = await User.findOne({ walletAddress: userAddress.toLowerCase() });
                if (!user) {
                    logger.warn(`User ${userAddress} not found.`);
                    return;
                }

                const slot = await Slot.findOne({ slotNumber: slotNumber });
                if (!slot) {
                    logger.warn(`Slot ${slotNumber} not found.`);
                    return;
                }

                user.activateSlot(parseInt(slotNumber));
                slot.purchaseCount += 1;
                slot.lastPurchaseDate = new Date();
                await slot.save();

                const transaction = new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: userAddress,
                    toAddress: process.env.CONTRACT_ADDRESS,
                    amount: slot.price,
                    transactionType: 'purchase',
                    relatedUser: user._id,
                    description: `Slot ${slotNumber} purchased`,
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasUsed
                });
                await transaction.save();

                logger.info(`Slot ${slotNumber} purchased by ${userAddress} successfully.`);
            } catch (error) {
                logger.error('Error handling SlotPurchased event:', error);
            }
        });

        // Add other event listeners as needed
        this.reown.events.on('MatrixIncomePaid', async (event) => {
            const { sender, receiver, slotNumber, amount } = event.data;
            logger.info(`Handling MatrixIncomePaid event: ${sender} -> ${receiver}, amount ${amount}, slot ${slotNumber}`);

            try {
                const user = await User.findOne({ walletAddress: receiver.toLowerCase() });
                if (!user) {
                    logger.warn(`User ${receiver} not found.`);
                    return;
                }

                await user.addEarnings('matrixIncome', parseFloat(amount));

                const income = new Income({
                    user: user._id,
                    incomeType: 'matrix',
                    amount: parseFloat(amount),
                    description: `Matrix income from slot ${slotNumber}`,
                    transactionHash: event.transactionHash,
                    relatedUser: (await User.findOne({ walletAddress: sender.toLowerCase() }))?._id,
                    slotNumber: parseInt(slotNumber)
                });
                await income.save();

                const transaction = new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: process.env.CONTRACT_ADDRESS,
                    toAddress: receiver,
                    amount: parseFloat(amount),
                    transactionType: 'income',
                    relatedUser: user._id,
                    description: `Matrix income from slot ${slotNumber}`,
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasUsed
                });
                await transaction.save();

                logger.info(`Matrix income paid to ${receiver} successfully.`);
            } catch (error) {
                logger.error('Error handling MatrixIncomePaid event:', error);
            }
        });

        this.reown.events.on('LevelIncomePaid', async (event) => {
            const { sender, receiver, levelNumber, amount } = event.data;
            logger.info(`Handling LevelIncomePaid event: ${sender} -> ${receiver}, amount ${amount}, level ${levelNumber}`);

            try {
                const user = await User.findOne({ walletAddress: receiver.toLowerCase() });
                if (!user) {
                    logger.warn(`User ${receiver} not found.`);
                    return;
                }

                await user.addEarnings('levelIncome', parseFloat(amount));

                const income = new Income({
                    user: user._id,
                    incomeType: 'level',
                    amount: parseFloat(amount),
                    description: `Level income from level ${levelNumber}`,
                    transactionHash: event.transactionHash,
                    relatedUser: (await User.findOne({ walletAddress: sender.toLowerCase() }))?._id,
                    levelNumber: parseInt(levelNumber)
                });
                await income.save();

                const transaction = new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: process.env.CONTRACT_ADDRESS,
                    toAddress: receiver,
                    amount: parseFloat(amount),
                    transactionType: 'income',
                    relatedUser: user._id,
                    description: `Level income from level ${levelNumber}`,
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasUsed
                });
                await transaction.save();

                logger.info(`Level income paid to ${receiver} successfully.`);
            } catch (error) {
                logger.error('Error handling LevelIncomePaid event:', error);
            }
        });

        this.reown.events.on('PoolIncomePaid', async (event) => {
            const { receiver, amount } = event.data;
            logger.info(`Handling PoolIncomePaid event: ${receiver}, amount ${amount}`);

            try {
                const user = await User.findOne({ walletAddress: receiver.toLowerCase() });
                if (!user) {
                    logger.warn(`User ${receiver} not found.`);
                    return;
                }

                await user.addEarnings('poolIncome', parseFloat(amount));

                const income = new Income({
                    user: user._id,
                    incomeType: 'pool',
                    amount: parseFloat(amount),
                    description: 'Pool income',
                    transactionHash: event.transactionHash
                });
                await income.save();

                const transaction = new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: process.env.CONTRACT_ADDRESS,
                    toAddress: receiver,
                    amount: parseFloat(amount),
                    transactionType: 'income',
                    relatedUser: user._id,
                    description: 'Pool income',
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasUsed
                });
                await transaction.save();

                logger.info(`Pool income paid to ${receiver} successfully.`);
            } catch (error) {
                logger.error('Error handling PoolIncomePaid event:', error);
            }
        });

        this.reown.events.on('Rebirth', async (event) => {
            const { userAddress, slotNumber } = event.data;
            logger.info(`Handling Rebirth event for ${userAddress}, slot ${slotNumber}`);

            try {
                const user = await User.findOne({ walletAddress: userAddress.toLowerCase() });
                if (!user) {
                    logger.warn(`User ${userAddress} not found.`);
                    return;
                }

                user.processRebirth(parseInt(slotNumber));

                const slot = await Slot.findOne({ slotNumber: slotNumber });

                const transaction = new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: userAddress,
                    toAddress: process.env.CONTRACT_ADDRESS,
                    amount: slot.price,
                    transactionType: 'rebirth',
                    relatedUser: user._id,
                    description: `Rebirth on slot ${slotNumber}`,
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasUsed
                });
                await transaction.save();

                logger.info(`Rebirth processed for ${userAddress} on slot ${slotNumber} successfully.`);
            } catch (error) {
                logger.error('Error handling Rebirth event:', error);
            }
        });

        this.reown.events.on('AdminFeePaid', async (event) => {
            const { receiver, amount } = event.data;
            logger.info(`Handling AdminFeePaid event: ${receiver}, amount ${amount}`);

            try {
                const user = await User.findOne({ walletAddress: receiver.toLowerCase() });
                if (!user) {
                    logger.warn(`User ${receiver} not found.`);
                    return;
                }

                const transaction = new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: process.env.CONTRACT_ADDRESS,
                    toAddress: receiver,
                    amount: parseFloat(amount),
                    transactionType: 'adminFee',
                    relatedUser: user._id,
                    description: 'Admin fee payment',
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasUsed
                });
                await transaction.save();

                logger.info(`Admin fee paid to ${receiver} successfully.`);
            } catch (error) {
                logger.error('Error handling AdminFeePaid event:', error);
            }
        });
    }

    // Example: Purchase slot via smart contract
    async purchaseSlot(userAddress, slotNumber) {
        try {
            // Assuming 'purchaseSlot' is a method in your smart contract
            const tx = await this.reown.contracts.call('purchaseSlot', {
                userAddress,
                slotNumber,
            });
            logger.info('Slot purchase transaction sent:', tx.hash);
            return tx;
        } catch (error) {
            logger.error('Error purchasing slot:', error);
            throw error;
        }
    }

    // Send notification to user
    async sendNotification(toAddress, title, body) {
        try {
            await this.reown.notifications.send({
                to: toAddress,
                title,
                body,
            });
            logger.info(`Notification sent to ${toAddress}: ${title}`);
        } catch (error) {
            logger.error('Error sending notification:', error);
        }
    }
}

module.exports = new ReownService();