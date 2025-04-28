const User = require('../models/user');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } }, 'username email profilePicture userId ');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
};
 