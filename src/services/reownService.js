const Reown = require('reown');
const User = require('../models/User');
const Slot = require('../models/Slot');
const Transaction = require('../models/Transaction');
const Income = require('../models/Income');
const { info, error: _error, warn } = require('../utils/logger');

class ReownService {
    constructor() {
        this.reown = new Reown({
            projectId: 'ad2dd65a23e891dd4b2fea2683b048ca',
           /*  apiKey: process.env.REOWN_API_KEY, */
            // Add other config options if needed
        });
    }

    initEventListeners() {
        this.reown.events.on('UserRegistered', async (event) => {
            const { walletAddress, username, referralCode } = event.data;
            info(`Handling UserRegistered event for ${walletAddress}`);

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
                    info(`User ${walletAddress} registered successfully.`);
                } else {
                    info(`User ${walletAddress} already registered.`);
                }
            } catch (error) {
                _error('Error handling UserRegistered event:', error);
            }
        });

        // ... repeat similar changes for other event listeners ...

        this.reown.events.on('SlotPurchased', async (event) => {
            const { userAddress, slotNumber } = event.data;
            info(`Handling SlotPurchased event for ${userAddress}, slot ${slotNumber}`);

            try {
                let user = await User.findOne({ walletAddress: userAddress.toLowerCase() });
                if (!user) {
                    warn(`User ${userAddress} not found.`);
                    return;
                }

                const slot = await Slot.findOne({ slotNumber: slotNumber });
                if (!slot) {
                    warn(`Slot ${slotNumber} not found.`);
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

                info(`Slot ${slotNumber} purchased by ${userAddress} successfully.`);
            } catch (error) {
                _error('Error handling SlotPurchased event:', error);
            }
        });

        // ... (same for all other listeners) ...
    }

    async purchaseSlot(userAddress, slotNumber) {
        try {
            const tx = await this.reown.contracts.call('purchaseSlot', {
                userAddress,
                slotNumber,
            });
            info('Slot purchase transaction sent:', tx.hash);
            return tx;
        } catch (error) {
            _error('Error purchasing slot:', error);
            throw error;
        }
    }

    async sendNotification(toAddress, title, body) {
        try {
            await this.reown.notifications.send({
                to: toAddress,
                title,
                body,
            });
            info(`Notification sent to ${toAddress}: ${title}`);
        } catch (error) {
            _error('Error sending notification:', error);
        }
    }
}

module.exports = new ReownService();
// This code is a service for handling interactions with the Reown SDK.
// It listens for various events such as user registration, slot purchases, and more.   