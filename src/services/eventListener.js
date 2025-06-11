const Web3 = require('web3');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Income = require('../models/Income');
const Slot = require('../models/Slot');

const web3 = new Web3(process.env.BLOCKCHAIN_NODE_URL);

const contractABI = JSON.parse(process.env.CONTRACT_ABI);
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);

const startBlock = parseInt(process.env.START_BLOCK) || 0;

async function startEventListener() {
    console.log('Starting event listener...');

    try {
        await processHistoricalEvents();
        subscribeToEvents();
    } catch (error) {
        console.error('Error starting event listener:', error);
        setTimeout(startEventListener, 60000); // Retry after 1 minute
    }
}

async function processHistoricalEvents() {
    console.log('Processing historical events...');

    const latestBlock = await web3.eth.getBlockNumber();
    let fromBlock = startBlock;

    while (fromBlock <= latestBlock) {
        const toBlock = Math.min(fromBlock + 9999, latestBlock); // Web3 limit
        console.log(`Fetching events from block ${fromBlock} to ${toBlock}`);

        try {
            const events = await contract.getPastEvents('allEvents', {
                fromBlock: fromBlock,
                toBlock: toBlock
            });

            console.log(`Found ${events.length} events`);
            for (const event of events) {
                await handleEvent(event);
            }

            fromBlock = toBlock + 1;
        } catch (error) {
            console.error('Error fetching historical events:', error);
            throw error; // Stop processing
        }
    }

    console.log('Historical events processing complete.');
}

function subscribeToEvents() {
    console.log('Subscribing to new events...');

    contract.events.allEvents({
        fromBlock: 'latest'
    })
    .on('data', async (event) => {
        console.log('New event received:', event.event);
        await handleEvent(event);
    })
    .on('error', (error) => {
        console.error('Error in event subscription:', error);
        setTimeout(subscribeToEvents, 60000); // Retry after 1 minute
    });
}

async function handleEvent(event) {
    try {
        switch (event.event) {
            case 'UserRegistered':
                await handleUserRegistered(event);
                break;
            case 'SlotPurchased':
                await handleSlotPurchased(event);
                break;
            case 'MatrixIncomePaid':
                await handleMatrixIncomePaid(event);
                break;
            case 'LevelIncomePaid':
                await handleLevelIncomePaid(event);
                break;
            case 'PoolIncomePaid':
                await handlePoolIncomePaid(event);
                break;
            case 'Rebirth':
                await handleRebirth(event);
                break;
            case 'AdminFeePaid':
                await handleAdminFeePaid(event);
                break;
            default:
                console.log('Unhandled event:', event.event);
        }
    } catch (error) {
        console.error('Error handling event:', event, error);
    }
}

async function handleUserRegistered(event) {
    const { walletAddress, username, referralCode } = event.returnValues;
    console.log(`Handling UserRegistered event for ${walletAddress}`);

    try {
        const existingUser = await User.findByWallet(walletAddress);
        if (existingUser) {
            console.log(`User ${walletAddress} already registered.`);
            return;
        }

        let referredBy = null;
        if (referralCode && referralCode !== '') {
            const referrer = await User.findByReferralCode(referralCode);
            if (referrer) {
                referredBy = referrer._id;
                referrer.directReferrals.push(newUser._id);
                referrer.teamSize.direct = referrer.directReferrals.length;
                referrer.teamSize.total += 1;
                await referrer.save();
            }
        }

        const newUser = new User({
            walletAddress: walletAddress.toLowerCase(),
            username,
            email: `${username}@example.com`, // Dummy email
            referredBy,
            referralCode: User.prototype.generateReferralCode(),
        });

        await newUser.save();
        console.log(`User ${walletAddress} registered successfully.`);
    } catch (error) {
        console.error('Error handling UserRegistered event:', error);
    }
}

async function handleSlotPurchased(event) {
    const { userAddress, slotNumber } = event.returnValues;
    console.log(`Handling SlotPurchased event for ${userAddress}, slot ${slotNumber}`);

    try {
        const user = await User.findByWallet(userAddress);
        if (!user) {
            console.log(`User ${userAddress} not found.`);
            return;
        }

        const slot = await Slot.findOne({ slotNumber: slotNumber });
        if (!slot) {
            console.log(`Slot ${slotNumber} not found.`);
            return;
        }

        user.activateSlot(parseInt(slotNumber));
        slot.purchaseCount += 1;
        slot.lastPurchaseDate = new Date();
        await slot.save();

        const transaction = new Transaction({
            transactionHash: event.transactionHash,
            fromAddress: userAddress,
            toAddress: contractAddress,
            amount: slot.price,
            transactionType: 'purchase',
            relatedUser: user._id,
            description: `Slot ${slotNumber} purchased`,
            blockNumber: event.blockNumber,
            gasUsed: event.gasUsed
        });
        await transaction.save();

        console.log(`Slot ${slotNumber} purchased by ${userAddress} successfully.`);
    } catch (error) {
        console.error('Error handling SlotPurchased event:', error);
    }
}

async function handleMatrixIncomePaid(event) {
    const { sender, receiver, slotNumber, amount } = event.returnValues;
    console.log(`Handling MatrixIncomePaid event: ${sender} -> ${receiver}, amount ${amount}, slot ${slotNumber}`);

    try {
        const user = await User.findByWallet(receiver);
        if (!user) {
            console.log(`User ${receiver} not found.`);
            return;
        }

        await user.addEarnings('matrixIncome', parseFloat(amount));

        const income = new Income({
            user: user._id,
            incomeType: 'matrix',
            amount: parseFloat(amount),
            description: `Matrix income from slot ${slotNumber}`,
            transactionHash: event.transactionHash,
            relatedUser: (await User.findByWallet(sender))?._id,
            slotNumber: parseInt(slotNumber)
        });
        await income.save();

        const transaction = new Transaction({
            transactionHash: event.transactionHash,
            fromAddress: contractAddress,
            toAddress: receiver,
            amount: parseFloat(amount),
            transactionType: 'income',
            relatedUser: user._id,
            description: `Matrix income from slot ${slotNumber}`,
            blockNumber: event.blockNumber,
            gasUsed: event.gasUsed
        });
        await transaction.save();

        console.log(`Matrix income paid to ${receiver} successfully.`);
    } catch (error) {
        console.error('Error handling MatrixIncomePaid event:', error);
    }
}

async function handleLevelIncomePaid(event) {
    const { sender, receiver, levelNumber, amount } = event.returnValues;
    console.log(`Handling LevelIncomePaid event: ${sender} -> ${receiver}, amount ${amount}, level ${levelNumber}`);

    try {
        const user = await User.findByWallet(receiver);
        if (!user) {
            console.log(`User ${receiver} not found.`);
            return;
        }

        await user.addEarnings('levelIncome', parseFloat(amount));

        const income = new Income({
            user: user._id,
            incomeType: 'level',
            amount: parseFloat(amount),
            description: `Level income from level ${levelNumber}`,
            transactionHash: event.transactionHash,
            relatedUser: (await User.findByWallet(sender))?._id,
            levelNumber: parseInt(levelNumber)
        });
        await income.save();

         const transaction = new Transaction({
            transactionHash: event.transactionHash,
            fromAddress: contractAddress,
            toAddress: receiver,
            amount: parseFloat(amount),
            transactionType: 'income',
            relatedUser: user._id,
            description: `Level income from level ${levelNumber}`,
            blockNumber: event.blockNumber,
            gasUsed: event.gasUsed
        });
        await transaction.save();

        console.log(`Level income paid to ${receiver} successfully.`);
    } catch (error) {
        console.error('Error handling LevelIncomePaid event:', error);
    }
}

async function handlePoolIncomePaid(event) {
    const { receiver, amount } = event.returnValues;
    console.log(`Handling PoolIncomePaid event: ${receiver}, amount ${amount}`);

    try {
        const user = await User.findByWallet(receiver);
        if (!user) {
            console.log(`User ${receiver} not found.`);
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
            fromAddress: contractAddress,
            toAddress: receiver,
            amount: parseFloat(amount),
            transactionType: 'income',
            relatedUser: user._id,
            description: 'Pool income',
            blockNumber: event.blockNumber,
            gasUsed: event.gasUsed
        });
        await transaction.save();

        console.log(`Pool income paid to ${receiver} successfully.`);
    } catch (error) {
        console.error('Error handling PoolIncomePaid event:', error);
    }
}

async function handleRebirth(event) {
    const { userAddress, slotNumber } = event.returnValues;
    console.log(`Handling Rebirth event for ${userAddress}, slot ${slotNumber}`);

    try {
        const user = await User.findByWallet(userAddress);
        if (!user) {
            console.log(`User ${userAddress} not found.`);
            return;
        }

        user.processRebirth(parseInt(slotNumber));

        const slot = await Slot.findOne({ slotNumber: slotNumber });

        const transaction = new Transaction({
            transactionHash: event.transactionHash,
            fromAddress: userAddress,
            toAddress: contractAddress,
            amount: slot.price,
            transactionType: 'rebirth',
            relatedUser: user._id,
            description: `Rebirth on slot ${slotNumber}`,
            blockNumber: event.blockNumber,
            gasUsed: event.gasUsed
        });
        await transaction.save();

        console.log(`Rebirth processed for ${userAddress} on slot ${slotNumber} successfully.`);
    } catch (error) {
        console.error('Error handling Rebirth event:', error);
    }
}

async function handleAdminFeePaid(event) {
    const { receiver, amount } = event.returnValues;
    console.log(`Handling AdminFeePaid event: ${receiver}, amount ${amount}`);

    try {
        const user = await User.findByWallet(receiver);
        if (!user) {
            console.log(`User ${receiver} not found.`);
            return;
        }

        const transaction = new Transaction({
            transactionHash: event.transactionHash,
            fromAddress: contractAddress,
            toAddress: receiver,
            amount: parseFloat(amount),
            transactionType: 'adminFee',
            relatedUser: user._id,
            description: 'Admin fee payment',
            blockNumber: event.blockNumber,
            gasUsed: event.gasUsed
        });
        await transaction.save();

        console.log(`Admin fee paid to ${receiver} successfully.`);
    } catch (error) {
        console.error('Error handling AdminFeePaid event:', error);
    }
}

module.exports = {
    startEventListener
};