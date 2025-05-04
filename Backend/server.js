const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://chat-app-git-main-abrhams-projects-8f2aac01.vercel.app/',
    methods: ['GET', 'POST', 'PUT']
   },
});

app.use(
  cors({
    origin: 'https://chat-app-git-main-abrhams-projects-8f2aac01.vercel.app/',
    methods: ['GET', 'POST', 'PUT']
   })
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use((req, res, next) => {
  req.io = io;
  next();
});

const uri = process.env.ATLAS_URL;
mongoose
  .connect(uri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/messages', messageRoutes);
app.use('/groups', groupRoutes);
app.use('/profile', profileRoutes);

const onlineUsers = new Set();
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('userConnected', (userId) => {
    onlineUsers.add(userId);
    io.emit('onlineUsers', Array.from(onlineUsers));
  });

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  socket.on('markMessageRead', async (data) => {
    try {
      const { messageId, userId, chatId, groupId } = data;
      const message = await require('./models/message')
        .findByIdAndUpdate(
          messageId,
          { $addToSet: { readBy: userId } },
          { new: true }
        )
        .populate('sender', 'username profilePicture')
        .populate('readBy', 'username profilePicture');
      if (chatId) {
        io.to(chatId).emit('messageRead', message);
      } else if (groupId) {
        io.to(groupId).emit('messageRead', message);
      }
      console.log(`Message ${messageId} marked as read by ${userId}`);
    } catch (error) {
      console.error('Error marking message read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/test', (req, res) => res.send('Backend is running'));

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});