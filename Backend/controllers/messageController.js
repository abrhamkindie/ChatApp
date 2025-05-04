const Message = require('../models/message');
const cloudinary = require('cloudinary').v2;

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    const messages = await Message.find({ chatId })
      .populate('sender', 'username profilePicture')
      .populate('readBy', 'username profilePicture');
    const unreadCount = messages.filter(
      (msg) => !msg.readBy.some((u) => u._id.toString() === userId) && msg.sender._id.toString() !== userId
    ).length;
    res.json({ messages, unreadCount });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.markMessageRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    const message = await Message.findById(messageId)
      .populate('sender', 'username profilePicture')
      .populate('readBy', 'username profilePicture');
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (!message.readBy.some((u) => u._id.toString() === userId)) {
      message.readBy.push(userId);
      await message.save();
      if (message.chatId) {
        req.io.to(message.chatId).emit('messageRead', message);
      } else if (message.group) {
        req.io.to(message.group.toString()).emit('messageRead', message);
      }
    }
    res.json(message);
  } catch (err) {
    console.error('Mark message read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    const { file, fileType, fileName, chatId, groupId, content } = req.body;
    if (!file || !fileType || !fileName) {
      return res.status(400).json({ error: 'File, fileType, and fileName are required' });
    }
    if (!chatId && !groupId) {
      return res.status(400).json({ error: 'chatId or groupId is required' });
    }
    if (!fileType.match(/^(image\/(jpeg|png|gif)|application\/pdf)$/)) {
      return res.status(400).json({ error: 'Only images (jpeg, png, gif) or PDFs are allowed' });
    }
    const result = await cloudinary.uploader.upload(file, {
      folder: 'chat_files',
      resource_type: fileType.startsWith('image') ? 'image' : 'raw',
    });
    const message = new Message({
      sender: req.user.userId,
      content: content || '',
      fileUrl: result.secure_url,
      fileType,
      fileName,
      chatId: chatId || null,
      group: groupId || null,
      readBy: [req.user.userId],
    });
    await message.save();
    await message.populate('sender', 'username profilePicture');
    if (chatId) {
      req.io.to(chatId).emit('receiveMessage', message);
    } else if (groupId) {
      req.io.to(groupId).emit('receiveGroupMessage', message);
    }
    res.json(message);
  } catch (err) {
    console.error('Upload file error:', err);
    res.status(500).json({ error: 'Failed to upload file', details: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const senderId = req.user.userId;
    if (!chatId || !content) {
      return res.status(400).json({ error: 'Chat ID and content are required' });
    }
    const [user1, user2] = chatId.split('-');
    if (![user1, user2].includes(senderId)) {
      return res.status(403).json({ error: 'You are not part of this chat' });
    }
    const message = new Message({
      sender: senderId,
      content,
      chatId,
      readBy: [senderId],
      timestamp: new Date(),
    });
    await message.save();
    await message.populate('sender', 'username profilePicture');
    req.io.to(chatId).emit('receiveMessage', message);
    res.status(201).json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};