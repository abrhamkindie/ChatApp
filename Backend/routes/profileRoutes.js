const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, profileController.getProfile);
router.get('/:userId', authenticate, profileController.getUserProfile);
router.put('/', authenticate, profileController.updateProfile);

module.exports = router;



 