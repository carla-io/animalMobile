const mongoose = require('mongoose');

const animalBehaviorSchema = new mongoose.Schema({
  animalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  eating: {
    type: String,
    enum: ['Normal', 'Low', 'None'],
    required: true
  },
  movement: {
    type: String,
    enum: ['Active', 'Lazy', 'Limping'],
    required: true
  },
  mood: {
    type: String,
    enum: ['Calm', 'Aggressive', 'Anxious'],
    required: true
  },
  notes: {
    type: String
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('AnimalBehavior', animalBehaviorSchema);
