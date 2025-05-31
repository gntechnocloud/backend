const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticateJWT, optionalAuth, requireRegisteredUser, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/stats', systemController.getPlatformStats);
router.get('/leaderboard', systemController.getLeaderboard);
router.get('/search', optionalAuth, systemController.searchUsers);
router.get('/activity', optionalAuth, systemController.getActivityFeed);

module.exports = router;