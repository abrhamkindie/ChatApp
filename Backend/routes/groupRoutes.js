const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, groupController.createGroup);
router.get('/', authenticate, groupController.getGroups);
router.get('/all', authenticate, groupController.getAllGroups);
router.post('/:groupId/join', authenticate, groupController.joinGroup);
router.put('/:id/update', authenticate, groupController.updateGroupPicture);

// Group messages
router.post('/:groupId/messages', authenticate, groupController.sendGroupMessage);
router.get('/:groupId/messages', authenticate, groupController.getGroupMessages);

module.exports = router;
 