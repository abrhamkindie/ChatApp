  
const mongoose = require('mongoose');
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  profilePicture: { type: String, default: '' },
}, { timestamps: true });
module.exports = mongoose.model('Group', groupSchema);