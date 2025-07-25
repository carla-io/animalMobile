// routes/behavior.js
const express = require('express');
const router = express.Router();
const AnimalBehavior = require('../models/AnimalBehavior');
const Animal = require('../models/Animals');

//add behavior log
// router.post('/add', async (req, res) => {
//   try {
//     const newLog = new AnimalBehavior(req.body);
//     await newLog.save();
//     res.status(201).json({ message: 'Behavior log saved successfully.' });
//   } catch (err) {
//     res.status(500).json({ error: 'Error saving behavior log.' });
//   }
// });


router.post('/add', async (req, res) => {
  try {
    const newLog = new AnimalBehavior(req.body);
    await newLog.save();

    const { animalId, eating, movement, mood } = req.body;

    // Check for critical behavior
    const needsAttention = (
      eating === 'None' ||
      movement === 'Limping' ||
      mood === 'Aggressive'
    );

    if (needsAttention) {
      await Animal.findByIdAndUpdate(animalId, { status: 'needs_attention' });

      // Optional: log an alert or send email to admin
      console.log(`⚠️ Animal ${animalId} flagged for attention.`);

      // You can insert a notification to DB or trigger admin action here
    }

    res.status(201).json({ message: 'Behavior log saved successfully.' });
  } catch (err) {
    console.error('Error saving behavior log:', err);
    res.status(500).json({ error: 'Error saving behavior log.' });
  }
});
////get behavior of sinle  animal
// exports.getBehaviorsByAnimalId = async (req, res) => {
//   const { animalId } = req.params;

//   try {
//     const behaviors = await AnimalBehavior.find({ animalId })
//       .populate('recordedBy', 'name email') // optional: show who recorded
//       .sort({ createdAt: -1 }); // latest first

//     res.status(200).json({
//       success: true,
//       count: behaviors.length,
//       behaviors,
//     });
//   } catch (error) {
//     console.error('Error fetching behaviors:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };


router.get('/singlebehavior/:animalId', async (req, res) => {
  const { animalId } = req.params;

  try {
    const behaviors = await AnimalBehavior.find({ animalId })
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: behaviors.length,
      behaviors,
    });
  } catch (error) {
    console.error('Error fetching behaviors:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all behavior logs
router.get('/getAll', async (req, res) => {
  try {
    const behaviors = await AnimalBehavior.find()
      .populate('animalId', 'name species breed') // populate animal details
      .populate('recordedBy', 'name email') // populate user details
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      success: true,
      count: behaviors.length,
      behaviors,
    });
  } catch (error) {
    console.error('Error fetching all behaviors:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Optional: Get behaviors with filtering and pagination
router.get('/getAll/filtered', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      animalId, 
      eating, 
      movement, 
      mood,
      startDate,
      endDate 
    } = req.query;

    // Build filter object
    const filter = {};
    if (animalId) filter.animalId = animalId;
    if (eating) filter.eating = eating;
    if (movement) filter.movement = movement;
    if (mood) filter.mood = mood;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const behaviors = await AnimalBehavior.find(filter)
      .populate('animalId', 'name species breed')
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AnimalBehavior.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: behaviors.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      behaviors,
    });
  } catch (error) {
    console.error('Error fetching filtered behaviors:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
module.exports = router;