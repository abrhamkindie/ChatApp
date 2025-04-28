 

 const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/authMiddleware');

// Private chat messages
router.post('/', authenticate, messageController.sendMessage); // Send text message
router.post('/upload', authenticate, messageController.uploadFile); // Send file
router.get('/:chatId', authenticate, messageController.getMessages); // Get messages
router.put('/:messageId/read', authenticate, messageController.markMessageRead); // Mark as read

  

module.exports = router;
  
 
 

 