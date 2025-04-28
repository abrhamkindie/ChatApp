const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({ 
  chatId: { type: String, default: ''},
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group',default: null},
  sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: {type: String, default: '' },
  fileUrl: {type: String, default: '' },
  fileType: {type: String, default: ''},
  readBy: [{type: mongoose.Schema.Types.ObjectId,ref: 'User'}],
  timestamp: {type: Date,default: Date.now}
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
 

 