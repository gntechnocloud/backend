const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT, requireRegisteredUser } = require('../middleware/auth');

router.get('/profile', authenticateJWT, requireRegisteredUser, userController.getProfile);
router.get('/earnings', authenticateJWT, requireRegisteredUser, userController.getEarnings);
router.get('/referral-tree', authenticateJWT, requireRegisteredUser, userController.getReferralTree);
router.get('/slots', authenticateJWT, requireRegisteredUser, userController.getSlotStatus);
router.get('/income-history', authenticateJWT, requireRegisteredUser, userController.getIncomeHistory);
//router.get('/referral-earnings', authenticateJWT, requireRegisteredUser, userController.getReferralEarnings);
//router.get('/referral-earnings/:username', authenticateJWT, requireRegisteredUser, userController.getReferralEarningsByUsername);
router.get('/:wallet', userController.getUserByWallet);

module.exports = router;