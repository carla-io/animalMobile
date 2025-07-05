const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Feeding', 'Cleaning', 'Health Check', 'Medication', 'Observation', 'Weight Monitoring'],
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  animalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: true
  },
  scheduleDate: {
    type: Date,
    required: function () {
    return this.isRecurring || !!this.scheduleTime;
  }
  },
  scheduleTimes: {
    type: [String], // e.g., ['08:00', '12:00', '18:00']
    validate: {
      validator: function (val) {
        return !val || val.every(t => /^\d{2}:\d{2}$/.test(t));
      },
      message: 'Each schedule time must be in HH:mm format.'
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly'],
    required: function () {
      return this.isRecurring;
    }
  },
  endDate: {
    type: Date,
    required: function () {
      return this.isRecurring;
    },
    validate: {
      validator: function (val) {
        return !this.scheduleDate || !val || val >= this.scheduleDate;
      },
      message: 'End date must be after or equal to the start date.'
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);