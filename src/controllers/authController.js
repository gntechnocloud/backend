//const Web3 = require('web3');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

//const web3 = new Web3(process.env.BLOCKCHAIN_NODE_URL);
const Web3 = require('web3').default;
const web3 = new Web3(process.env.BLOCKCHAIN_NODE_URL);

async function login(req, res) {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
        return res.status(400).json({ message: 'Wallet address and signature are required' });
    }

    try {
        const user = await User.findByWallet(walletAddress);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Please register.' });
        }

        const message = `Sign this message to authenticate with Fortunity NXT: ${user.nonce}`;
        const recoveredAddress = web3.eth.accounts.recover(message, signature).toLowerCase();

        if (recoveredAddress !== walletAddress.toLowerCase()) {
            return res.status(401).json({ message: 'Invalid signature' });
        }

        const token = jwt.sign({
            userId: user._id,
            walletAddress: user.walletAddress,
            role: 'user'
        }, process.env.JWT_SECRET, { expiresIn: '12h' });

        user.nonce = null;
        user.lastLogin = new Date();
        await user.save();

        res.json({ token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
}

async function generateNonce(req, res) {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
    }

    try {
        let user = await User.findByWallet(walletAddress);
        if (!user) {
            // Create a new user with minimal information
            user = new User({
                walletAddress: walletAddress.toLowerCase(),
                username: `user_${Date.now()}`, // Temporary username
                email: `temp_${Date.now()}@example.com`, // Temporary email
                referralCode: User.prototype.generateReferralCode()
            });
        }

        user.nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await user.save();

        res.json({ nonce: user.nonce });

    } catch (error) {
        console.error('Generate nonce error:', error);
        res.status(500).json({ message: 'Failed to generate nonce', error: error.message });
    }
}

async function verifyToken(req, res) {
    // This endpoint is primarily for testing the middleware
    res.json({ message: 'Token is valid', user: req.user });
}

module.exports = {
    login,
    generateNonce,
    verifyToken
};