// routes/behavior.js
const express = require('express');
const router = express.Router();
const AnimalBehavior = require('../models/AnimalBehavior');
const Animal = require('../models/Animals');
const User = require('../models/User');

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

// routes/behavior.js

router.post('/assign-vet', async (req, res) => {
  console.log('Assign vet request received:', req.body);
  
  const { animalId, vetId, reason } = req.body;

  console.log('AnimalId:', animalId);
  console.log('VetId:', vetId);
  console.log('Reason:', reason);

  if (!animalId || !vetId) {
    console.log('Missing required fields');
    return res.status(400).json({ 
      success: false,
      message: 'Animal ID and Vet ID are required.' 
    });
  }

  try {
    console.log('Looking for animal with ID:', animalId);
    const animal = await Animal.findById(animalId);
    console.log('Animal found:', animal ? animal.name : 'Not found');
    
    if (!animal) {
      console.log('Animal not found');
      return res.status(404).json({ 
        success: false,
        message: 'Animal not found.' 
      });
    }

    console.log('Looking for vet with ID:', vetId);
    // Now User is properly imported and defined
    const vet = await User.findOne({ _id: vetId, userType: 'vet' });
    console.log('Vet found:', vet ? vet.name : 'Not found');
    
    if (!vet) {
      console.log('Vet not found or invalid user type');
      return res.status(404).json({ 
        success: false,
        message: 'Veterinarian not found or invalid user type.' 
      });
    }

    // Check if vet is already assigned
    if (animal.vetId && animal.vetId.toString() === vetId) {
      console.log('Vet already assigned');
      return res.status(400).json({ 
        success: false,
        message: `${vet.name} is already assigned to ${animal.name}.` 
      });
    }

    console.log('Assigning vet to animal...');
    animal.vetId = vetId;
    
    if (reason) {
      animal.assignmentReason = reason;
    }
    animal.assignedAt = new Date();
    
    console.log('Saving animal...');
    await animal.save();
    console.log('Animal saved successfully');

    const response = {
      success: true,
      message: `${vet.name} has been successfully assigned to ${animal.name}`,
      assignment: {
        animalId: animal._id,
        vetId: vet._id,
        animal: {
          _id: animal._id,
          name: animal.name,
          species: animal.species,
          breed: animal.breed,
          age: animal.age
        },
        vet: {
          _id: vet._id,
          name: vet.name,
          email: vet.email,
          phone: vet.phone,
          specialization: vet.specialization,
          location: vet.location,
          experience: vet.experience
        },
        reason: reason || null,
        assignedAt: animal.assignedAt
      }
    };

    console.log('Sending success response');
    res.status(200).json(response);

  } catch (error) {
    console.error('Error in assign-vet route:', error);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'CastError') {
      console.log('Cast error - invalid ID format');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid ID format provided.' 
      });
    }
    
    if (error.name === 'ValidationError') {
      console.log('Validation error:', error.message);
      return res.status(400).json({ 
        success: false,
        message: `Validation error: ${error.message}` 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while assigning veterinarian. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Get the animal with assigned vet details
router.get('/assigned-vet/:animalId', async (req, res) => {
  const { animalId } = req.params;

  try {
    console.log('Fetching animal with ID:', animalId);
    const animal = await Animal.findById(animalId).populate('vetId');

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal not found.'
      });
    }

    if (!animal.vetId) {
      return res.status(404).json({
        success: false,
        message: 'No vet has been assigned to this animal.'
      });
    }

    const response = {
      success: true,
      assignment: {
        animal: {
          _id: animal._id,
          name: animal.name,
          species: animal.species,
          breed: animal.breed,
          age: animal.age
        },
        vet: {
          _id: animal.vetId._id,
          // name: animal.vetId.name,
        },
        reason: animal.assignmentReason || null,
        assignedAt: animal.assignedAt || null
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching assigned vet:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assigned veterinarian.'
    });
  }
});


router.get('/vet/:vetId/assigned-animals', async (req, res) => {
  const { vetId } = req.params;

  try {
    console.log('Fetching animals assigned to vet:', vetId);

    // Validate vet exists and is a vet
    const vet = await User.findOne({ _id: vetId, userType: 'vet' });
    if (!vet) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian not found.'
      });
    }

    // Find animals assigned to this vet
    const animals = await Animal.find({ vetId }).select(
      '_id name species breed age assignmentReason assignedAt'
    );

    if (!animals.length) {
      return res.status(200).json({
        success: true,
        message: 'No animals currently assigned to this veterinarian.',
        animals: []
      });
    }

    res.status(200).json({
      success: true,
      vet: {
        _id: vet._id,
        name: vet.name,
        email: vet.email
      },
      assignedAnimals: animals
    });

  } catch (error) {
    console.error('Error fetching assigned animals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assigned animals.'
    });
  }
});



module.exports = router;