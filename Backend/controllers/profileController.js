const User = require('../models/user');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId, 'username email bio profilePicture ');
    if (!user) {
      console.error('User not found for ID:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }
     res.json({
      username: user.username || '',
      email: user.email || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || ''
    });
  } catch (error) {
    console.error('Error in getProfile:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId, 'username email bio profilePicture');
    if (!user) {
      console.error('User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
     res.json({
      username: user.username || '',
      email: user.email || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || ''
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error.message);
    res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, bio, password, profilePicture } = req.body;
 
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const existingUsername = await User.findOne({ username, _id: { $ne: req.user.userId } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    const existingEmail = await User.findOne({ email, _id: { $ne: req.user.userId } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already taken' });
    }

    const updates = { username, email, bio: bio || '' };

    if (profilePicture) {
      try {
         const result = await cloudinary.uploader.upload(profilePicture, {
          folder: 'mern-chat-app',
          allowed_formats: ['jpg', 'png', 'gif']
        });
         updates.profilePicture = result.secure_url;
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError.message);
        return res.status(400).json({ error: 'Failed to upload profile picture', details: cloudinaryError.message });
      }
    }

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('username email bio profilePicture');

    if (!user) {
      console.error('User not found for update:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }

     res.json({
      username: user.username || '',
      email: user.email || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || ''
    });
  } catch (error) {
    console.error('Error in updateProfile:', error.message);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
};
 