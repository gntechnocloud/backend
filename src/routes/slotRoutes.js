const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const { authenticateJWT, requireRegisteredUser } = require('../middleware/auth');

router.get('/', slotController.getAllSlots);
router.get('/:slotNumber', slotController.getSlotByNumber);
router.get('/:slotNumber/eligibility', authenticateJWT, requireRegisteredUser, slotController.checkEligibility);
router.post('/purchase', authenticateJWT, requireRegisteredUser, slotController.purchaseSlot); // Add purchase route

module.exports = router;