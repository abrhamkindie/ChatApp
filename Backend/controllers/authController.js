const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.register = async (req, res) => {
  try {
    const { username, email, password, profilePicture } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email ? 'Email already taken' : 'Username already taken'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { username, email, password: hashedPassword };

    if (profilePicture) {
      try {
         const result = await cloudinary.uploader.upload(profilePicture, {
          folder: 'mern-chat-app',
          allowed_formats: ['jpg', 'png', 'gif']
        });
         userData.profilePicture = result.secure_url;
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError.message);
        return res.status(400).json({ error: 'Failed to upload profile picture', details: cloudinaryError.message });
      }
    }

    const user = await User.create(userData);
     res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id, username: user.username });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

