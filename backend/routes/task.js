const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const mongoose = require('mongoose');

// ================================
// CREATE task
// ================================
router.post('/add', async (req, res) => {
  try {
    const {
      type,
      assignedTo,
      animalId,
      scheduleDate,
      scheduleTimes,
      isRecurring,
      recurrencePattern,
      endDate,
      status,
      completionVerified // ✅ Add this field
    } = req.body;

    // Validate required fields for recurring tasks
    if (isRecurring) {
      if (!scheduleDate) {
        return res.status(400).json({ error: 'Recurring tasks require a start date (scheduleDate).' });
      }
      if (!recurrencePattern || !endDate) {
        return res.status(400).json({ error: 'Recurring tasks require recurrencePattern and endDate.' });
      }
      if (new Date(endDate) <= new Date(scheduleDate)) {
        return res.status(400).json({ error: 'End date must be after the start date.' });
      }
    }

    // Validate completionVerified logic
    if (completionVerified && (!status || status !== 'Completed')) {
      return res.status(400).json({ error: 'Tasks can only be verified as completed if status is "Completed".' });
    }

    const task = new Task({
      type,
      assignedTo,
      animalId,
      scheduleDate: scheduleDate || null,
      scheduleTimes,
      isRecurring,
      recurrencePattern,
      endDate,
      status: status || 'Pending',
      completionVerified: completionVerified || false // ✅ Add this field (defaults to false)
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ================================
// GET all tasks (detailed view)
// ================================
// ================================
// GET all tasks (detailed view)
// ================================
router.get('/getAll', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo')
      .populate('animalId');

    const taskData = tasks.map(task => ({
      _id: task._id,
      type: task.type,
      assignedTo: task.assignedTo,
      animalId: task.animalId,
      scheduleDate: task.scheduleDate,
      scheduleTimes: task.scheduleTimes,
      isRecurring: task.isRecurring,
      recurrencePattern: task.recurrencePattern,
      endDate: task.endDate,
      status: task.status,
      completedAt: task.completedAt,
      completionVerified: task.completionVerified, // ✅ include this
      imageProof: task.imageProof, // ✅ include this
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));

    res.json(taskData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ================================
// GET calendar-friendly tasks
// ================================
router.get('/getTask', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('animalId', 'name species photo')
      .populate('assignedTo', 'name');

    const calendarEvents = [];

    tasks.forEach(task => {
      // 🚫 Skip completed tasks
      if (task.status === 'Completed') return;

      const animal = task.animalId || {};
      const assignedUser = task.assignedTo || {};

      if (!task.scheduleDate) return;

      const startDate = new Date(task.scheduleDate);
      const endDate = task.endDate ? new Date(task.endDate) : null;

      const recurrence = task.isRecurring ? task.recurrencePattern : null;
      const scheduleTimes = Array.isArray(task.scheduleTimes) ? task.scheduleTimes : [];

      const currentDate = new Date(startDate);

      const addEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];

        if (scheduleTimes.length > 0) {
          scheduleTimes.forEach(time => {
            const startDateTime = new Date(`${dateStr}T${time}`);
            calendarEvents.push({
              title: `${task.type} - ${animal.name || 'Unknown'}`,
              start: startDateTime,
              status: task.status,
              assignedTo: assignedUser.name || 'Unassigned',
              animal,
              allDay: false,
              taskId: task._id
            });
          });
        } else {
          calendarEvents.push({
            title: `${task.type} - ${animal.name || 'Unknown'}`,
            start: new Date(date),
            status: task.status,
            assignedTo: assignedUser.name || 'Unassigned',
            animal,
            allDay: true,
            taskId: task._id
          });
        }
      };

      if (recurrence && endDate) {
        while (currentDate <= endDate) {
          addEventsForDate(currentDate);
          if (recurrence === 'Daily') currentDate.setDate(currentDate.getDate() + 1);
          else if (recurrence === 'Weekly') currentDate.setDate(currentDate.getDate() + 7);
          else if (recurrence === 'Monthly') currentDate.setMonth(currentDate.getMonth() + 1);
          else break;
        }
      } else {
        addEventsForDate(currentDate);
      }
    });

    res.json(calendarEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});



// ================================
// GET tasks assigned to a user
// ================================
router.get('/user/:userId', async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.userId })
      .populate('animalId');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================
// UPDATE a task
// ================================
router.put('/edit/:id', async (req, res) => {
  try {
    const {
      type,
      assignedTo,
      animalId,
      scheduleDate,
      scheduleTimes,
      isRecurring,
      recurrencePattern,
      endDate,
      status,
      completionVerified, // ✅ Add this field
      imageProof // ✅ Add this field
    } = req.body;

    // Validate required fields for recurring tasks
    if (isRecurring) {
      if (!scheduleDate) {
        return res.status(400).json({ error: 'Recurring tasks require a start date (scheduleDate).' });
      }
      if (!recurrencePattern || !endDate) {
        return res.status(400).json({ error: 'Recurring tasks require recurrencePattern and endDate.' });
      }
      if (new Date(endDate) <= new Date(scheduleDate)) {
        return res.status(400).json({ error: 'End date must be after the start date.' });
      }
    }

    // Validate completion verification logic
    if (completionVerified === true) {
      if (!imageProof && status !== 'Completed') {
        return res.status(400).json({ 
          error: 'Tasks can only be verified as completed if they have image proof and status is "Completed".' 
        });
      }
      if (status !== 'Completed') {
        return res.status(400).json({ 
          error: 'Tasks can only be verified if status is "Completed".' 
        });
      }
    }

    // Get the current task to preserve existing data
    const currentTask = await Task.findById(req.params.id);
    if (!currentTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedData = {
      type,
      assignedTo,
      animalId,
      scheduleDate: scheduleDate || null,
      scheduleTimes,
      isRecurring,
      recurrencePattern,
      endDate,
      status,
      // Handle completedAt: set to current time if status changes to Completed, preserve existing if already completed
      completedAt: status === 'Completed' 
        ? (currentTask.completedAt || new Date()) 
        : null,
      // Handle completionVerified: only allow true if task is completed and has image proof
      completionVerified: (status === 'Completed' && (imageProof || currentTask.imageProof)) 
        ? (completionVerified !== undefined ? completionVerified : currentTask.completionVerified)
        : false,
      // Handle imageProof: update if provided, otherwise preserve existing
      imageProof: imageProof !== undefined ? imageProof : currentTask.imageProof
    };

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ================================
// DELETE a task
// ================================
router.delete('/delete/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Count pending tasks
router.get('/count/pending', async (req, res) => {
  try {
    const count = await Task.countDocuments({ status: 'Pending' });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Count completed tasks
router.get('/count/completed', async (req, res) => {
  try {
    const count = await Task.countDocuments({ status: 'Completed' });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/count/pending/:userId', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const count = await Task.countDocuments({
      assignedTo: userId,
      status: 'Pending'
    });

    res.json({ success: true, count });
  } catch (err) {
    console.error('❌ Error counting pending tasks:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Count completed tasks for a specific user
router.get('/count/completed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Task.countDocuments({
      assignedTo: new mongoose.Types.ObjectId(userId),
      status: 'Completed',
    });

    res.json({ success: true, count });
  } catch (err) {
    console.error('❌ Error counting completed tasks:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
