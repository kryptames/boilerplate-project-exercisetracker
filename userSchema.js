const mongoose = require('mongoose');
const shortid = require('shortid');

var userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
    unique: true
  },
  username:{
    type: String,
    required: true,
    unique: true
  },
  count:{
    type: Number
  },
  log:[
    {
      description:{
      type: String,
      required: true
      },
      duration:{
        type: Number,
        required: true
      },
      date:{
        type: Date,
        required: false
      }
    }
  ]
})

module.exports = mongoose.model('User', userSchema)