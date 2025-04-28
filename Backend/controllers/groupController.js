const Group = require('../models/group');
const Message = require('../models/message');
const User =require('../models/user');
const cloudinary = require('cloudinary').v2;


exports.createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ error: 'Group name and members are required' });
    }
     const members = await User.find({ _id: { $in: memberIds } });
 
    if (members.length !== memberIds.length) {
      return res.status(400).json({ error: 'Some users not found' });
    }
    const group = new Group({
      name,
      members: [...memberIds, req.user.userId],
      ownerId: req.user.userId,  
      profilePicture: ''  
    });
 
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

 

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId }).populate('members', 'username profilePicture');
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: { $ne: req.user.userId } }).populate('members', 'username');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all groups', details: error.message });
  }
};

 

exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (group.members.includes(req.user.userId)) {
      return res.status(400).json({ error: 'User already in group' });
    }
    group.members.push(req.user.userId);
    await group.save();
    const populatedGroup = await Group.findById(groupId).populate('members', 'username');
    res.json(populatedGroup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join group', details: error.message });
  }
};

 




exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
     const messages = await Message.find({ group: groupId })
      .populate('sender', 'username profilePicture')
      .populate('readBy', 'username');
     res.json(messages);
  } catch (err) {
    console.error('Get group messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



exports.sendGroupMessage = async (req, res) => {

   try {
    const { groupId } = req.params;
    const { content } = req.body;
    const senderId = req.user.userId;

 
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const message = new Message({
      sender: senderId,
      content,
      group: groupId,
      readBy: [senderId],
      timestamp: new Date(),
    });

    await message.save();

    // Populate sender for response
    await message.populate('sender', 'username profilePicture ');

    // Emit to group
    req.io.to(groupId).emit('receiveGroupMessage', message);

    res.status(201).json(message);
  } catch (err) {
    console.error('Send group message error:', err);
    res.status(500).json({ error: 'Failed to send group message' });
  }
};
 





 
exports.updateGroupPicture = async (req, res) => {
   try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only the group owner can update the picture' });
    }
    const { profilePicture } = req.body;
    if (profilePicture) {
      const result = await cloudinary.uploader.upload(profilePicture, {
        folder: 'group_pictures'
      });
      group.profilePicture = result.secure_url;
    }
    await group.save();
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

 