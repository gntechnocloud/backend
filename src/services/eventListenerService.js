import { ethers } from 'ethers';
import abi from '../config/abi.json';
import User from '../models/User';
import Slot from '../models/Slot';
import Transaction from '../models/Transaction';
import Income from '../models/Income';
import { info, error as logError, warn } from '../utils/logger';

class EventListenerService {
    constructor() {
        const provider = new ethers.WebSocketProvider(process.env.RPC_WS_URL);
        this.contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
    }

    listenAllEvents() {
        this.listenUserRegistered();
        this.listenSlotPurchased();
        this.listenMatrixIncome();
        this.listenLevelIncome();
        this.listenPoolIncome();
        this.listenRebirth();
        this.listenAdminFee();
    }

    listenUserRegistered() {
        this.contract.on('UserRegistered', async (walletAddress, username, referralCode, event) => {
            try {
                const address = walletAddress.toLowerCase();
                let user = await User.findOne({ walletAddress: address });

                if (!user) {
                    user = new User({
                        walletAddress: address,
                        username,
                        email: `${username}@example.com`,
                        referralCode: User.prototype.generateReferralCode(),
                    });
                    await user.save();
                    info(`User ${address} registered successfully.`);
                } else {
                    info(`User ${address} already exists.`);
                }
            } catch (err) {
                logError('UserRegistered error:', err);
            }
        });
    }

    listenSlotPurchased() {
        this.contract.on('SlotPurchased', async (userAddress, slotNumber, event) => {
            try {
                const address = userAddress.toLowerCase();
                const user = await User.findOne({ walletAddress: address });
                if (!user) return warn(`User ${address} not found`);

                const slot = await Slot.findOne({ slotNumber });
                if (!slot) return warn(`Slot ${slotNumber} not found`);

                user.activateSlot(slotNumber);
                slot.purchaseCount += 1;
                slot.lastPurchaseDate = new Date();
                await slot.save();

                const tx = new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: address,
                    toAddress: process.env.CONTRACT_ADDRESS,
                    amount: slot.price,
                    transactionType: 'purchase',
                    relatedUser: user._id,
                    description: `Slot ${slotNumber} purchased`,
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasLimit?.toString()
                });
                await tx.save();

                info(`Slot ${slotNumber} purchased by ${address}`);
            } catch (err) {
                logError('SlotPurchased error:', err);
            }
        });
    }

    listenMatrixIncome() {
        this.contract.on('MatrixIncomePaid', async (sender, receiver, slotNumber, amount, event) => {
            await this.handleIncomeEvent('matrix', sender, receiver, slotNumber, amount, event);
        });
    }

    listenLevelIncome() {
        this.contract.on('LevelIncomePaid', async (sender, receiver, levelNumber, amount, event) => {
            await this.handleIncomeEvent('level', sender, receiver, levelNumber, amount, event);
        });
    }

    listenPoolIncome() {
        this.contract.on('PoolIncomePaid', async (receiver, amount, event) => {
            try {
                const user = await User.findOne({ walletAddress: receiver.toLowerCase() });
                if (!user) return warn(`User ${receiver} not found`);

                await user.addEarnings('poolIncome', parseFloat(amount));

                await new Income({
                    user: user._id,
                    incomeType: 'pool',
                    amount: parseFloat(amount),
                    description: 'Pool income',
                    transactionHash: event.transactionHash
                }).save();

                await new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: process.env.CONTRACT_ADDRESS,
                    toAddress: receiver,
                    amount: parseFloat(amount),
                    transactionType: 'income',
                    relatedUser: user._id,
                    description: 'Pool income',
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasLimit?.toString()
                }).save();

                info(`Pool income paid to ${receiver}`);
            } catch (err) {
                logError('PoolIncomePaid error:', err);
            }
        });
    }

    listenRebirth() {
        this.contract.on('Rebirth', async (userAddress, slotNumber, event) => {
            try {
                const user = await User.findOne({ walletAddress: userAddress.toLowerCase() });
                if (!user) return warn(`User ${userAddress} not found`);

                user.processRebirth(parseInt(slotNumber));
                const slot = await Slot.findOne({ slotNumber });

                await new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: userAddress,
                    toAddress: process.env.CONTRACT_ADDRESS,
                    amount: slot?.price || 0,
                    transactionType: 'rebirth',
                    relatedUser: user._id,
                    description: `Rebirth on slot ${slotNumber}`,
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasLimit?.toString()
                }).save();

                info(`Rebirth on slot ${slotNumber} processed for ${userAddress}`);
            } catch (err) {
                logError('Rebirth error:', err);
            }
        });
    }

    listenAdminFee() {
        this.contract.on('AdminFeePaid', async (receiver, amount, event) => {
            try {
                const user = await User.findOne({ walletAddress: receiver.toLowerCase() });
                if (!user) return warn(`User ${receiver} not found`);

                await new Transaction({
                    transactionHash: event.transactionHash,
                    fromAddress: process.env.CONTRACT_ADDRESS,
                    toAddress: receiver,
                    amount: parseFloat(amount),
                    transactionType: 'adminFee',
                    relatedUser: user._id,
                    description: 'Admin fee',
                    blockNumber: event.blockNumber,
                    gasUsed: event.gasLimit?.toString()
                }).save();

                info(`Admin fee paid to ${receiver}`);
            } catch (err) {
                logError('AdminFeePaid error:', err);
            }
        });
    }

    async handleIncomeEvent(type, sender, receiver, levelOrSlot, amount, event) {
        try {
            const user = await User.findOne({ walletAddress: receiver.toLowerCase() });
            if (!user) return warn(`Receiver ${receiver} not found`);

            await user.addEarnings(`${type}Income`, parseFloat(amount));

            const relatedUser = await User.findOne({ walletAddress: sender.toLowerCase() });

            await new Income({
                user: user._id,
                incomeType: type,
                amount: parseFloat(amount),
                description: `${type} income from ${type === 'matrix' ? 'slot' : 'level'} ${levelOrSlot}`,
                transactionHash: event.transactionHash,
                relatedUser: relatedUser?._id,
                slotNumber: type === 'matrix' ? parseInt(levelOrSlot) : undefined,
                levelNumber: type === 'level' ? parseInt(levelOrSlot) : undefined
            }).save();

            await new Transaction({
                transactionHash: event.transactionHash,
                fromAddress: process.env.CONTRACT_ADDRESS,
                toAddress: receiver,
                amount: parseFloat(amount),
                transactionType: 'income',
                relatedUser: user._id,
                description: `${type} income from ${type === 'matrix' ? 'slot' : 'level'} ${levelOrSlot}`,
                blockNumber: event.blockNumber,
                gasUsed: event.gasLimit?.toString()
            }).save();

            info(`${type} income paid to ${receiver}`);
        } catch (err) {
            logError(`${type} income error:`, err);
        }
    }
}

export default new EventListenerService();
//         this.listenAllEvents();
//         logger.info('Event listeners initialized successfully');