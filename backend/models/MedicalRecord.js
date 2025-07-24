// models/MedicalRecord.js
const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  animal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: true
  },
  veterinarian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordType: {
    type: String,
    enum: ['checkup', 'treatment', 'vaccination', 'diagnosis', 'surgery', 'other'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  diagnosis: String,
  treatment: String,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  vaccines: [{
    name: String,
    type: String,
    dateAdministered: Date,
    nextDueDate: Date
  }],
  weight: Number,
  temperature: Number,
  notes: String,
  followUpDate: Date,
  attachments: [{
    url: String,
    type: String,
    description: String
  }],
  isCritical: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'follow_up'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
