const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

// const cloudinary = require('cloudinary').v2;

require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST', 'PUT'] },
});

// Middleware
app.use(cors({ 
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT'] }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use((req, res, next) => {
  req.io = io; // Attach io to req for controllers
  next();
});

// MongoDB Connection
const uri = process.env.ATLAS_URL;
mongoose
  .connect(uri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// // Cloudinary configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/messages', messageRoutes);
app.use('/groups', groupRoutes);
app.use('/profile', profileRoutes);

// Socket.IO
const onlineUsers = new Set();
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('userConnected', (userId) => {
    onlineUsers.add(userId);
    io.emit('onlineUsers', Array.from(onlineUsers));
  });

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
  });

  socket.on('markMessageRead', async (data) => {
    try {
      const { messageId, userId, chatId, groupId } = data;
      const message = await require('./models/message')
        .findByIdAndUpdate(messageId, { $addToSet: { readBy: userId } }, { new: true })
        .populate('sender readBy', 'username profilePicture');
      if (chatId) {
        io.to(chatId).emit('messageRead', message);
      } else if (groupId) {
        io.to(groupId).emit('messageRead', message);
      }
    } catch (error) {
      console.error('Error marking message read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
 