const express = require('express');
const router = express.Router();
const {
    getMyNotifications,
    getUnreadCount,
    markAllAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getMyNotifications);

router.route('/unread-count')
    .get(protect, getUnreadCount);

router.route('/read-all')
    .put(protect, markAllAsRead);

module.exports = router;
