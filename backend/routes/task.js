const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

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
      status
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

    const task = new Task({
      type,
      assignedTo,
      animalId,
      scheduleDate: scheduleDate || null,
      scheduleTimes,
      isRecurring,
      recurrencePattern,
      endDate,
      status: status || 'Pending'
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
router.get('/getAll', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo')
      .populate('animalId');
    res.json(tasks);
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
      status
    } = req.body;

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
      completedAt: status === 'Completed' ? new Date() : null
    };

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

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


module.exports = router;
