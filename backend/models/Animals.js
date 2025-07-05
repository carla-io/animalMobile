const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  species: { type: String, required: true },
  breed: { type: String },
  age: { type: Number },
  status: { type: String, enum: ['healthy', 'needs_attention'], default: 'healthy' },
  owner: { type: String },
  photo: {
    type: String,
    default: function () {
      return `${process.env.CLOUDINARY_BASE_URL}/default_profile.png`;
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Animal', animalSchema);