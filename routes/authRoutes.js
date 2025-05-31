const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/nonce', authController.generateNonce);
router.get('/verify', authController.verifyToken);

module.exports = router;