// routes/medicalRecords.js
const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const Animal = require('../models/Animals');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   POST api/medical-records
// @desc    Create a new medical record
// @access  Private (Vet only)
router.post(
  '/',
  [
    auth,
    [
      check('animal', 'Animal ID is required').not().isEmpty(),
      check('recordType', 'Record type is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is a veterinarian
      if (req.user.userType !== 'vet') {
        return res.status(403).json({ msg: 'Only veterinarians can create medical records' });
      }

      const animal = await Animal.findById(req.body.animal);
      if (!animal) {
        return res.status(404).json({ msg: 'Animal not found' });
      }

      const newRecord = new MedicalRecord({
        animal: req.body.animal,
        veterinarian: req.user.id,
        ...req.body
      });

      const record = await newRecord.save();
      res.json(record);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/medical-records
// @desc    Get all medical records (filterable)
// @access  Private (Vet only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is a veterinarian
    if (req.user.userType !== 'vet') {
      return res.status(403).json({ msg: 'Only veterinarians can view medical records' });
    }

    const { animal, recordType, status, dateFrom, dateTo } = req.query;
    const query = {};

    if (animal) query.animal = animal;
    if (recordType) query.recordType = recordType;
    if (status) query.status = status;
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    // For vets, show only records they created or for their assigned animals
    query.$or = [
      { veterinarian: req.user.id },
      // You might want to add additional conditions here based on your app logic
    ];

    const records = await MedicalRecord.find(query)
      .populate('animal', 'name species breed')
      .populate('veterinarian', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/medical-records/:id
// @desc    Get medical record by ID
// @access  Private (Vet only)
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('animal', 'name species breed')
      .populate('veterinarian', 'name');

    if (!record) {
      return res.status(404).json({ msg: 'Record not found' });
    }

    // Check if user is the vet who created the record or has appropriate permissions
    if (record.veterinarian._id.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to view this record' });
    }

    res.json(record);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/medical-records/:id
// @desc    Update medical record
// @access  Private (Vet only)
router.put('/:id', auth, async (req, res) => {
  try {
    let record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ msg: 'Record not found' });
    }

    // Check if user is the vet who created the record
    if (record.veterinarian.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this record' });
    }

    record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(record);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/medical-records/:id
// @desc    Delete medical record
// @access  Private (Vet only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ msg: 'Record not found' });
    }

    // Check if user is the vet who created the record or admin
    if (record.veterinarian.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this record' });
    }

await MedicalRecord.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Record removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/medical-records/animal/:animalId
// @desc    Get all medical records for a specific animal
// @access  Private (Vet only)
router.get('/animal/:animalId', auth, async (req, res) => {
  try {
    // Check if user is a veterinarian
    if (req.user.userType !== 'vet') {
      return res.status(403).json({ msg: 'Only veterinarians can view medical records' });
    }

    const animal = await Animal.findById(req.params.animalId);
    if (!animal) {
      return res.status(404).json({ msg: 'Animal not found' });
    }

    const records = await MedicalRecord.find({ animal: req.params.animalId })
      .populate('veterinarian', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Animal not found' });
    }
    res.status(500).send('Server Error');
  }
});

router.get('/user', auth, async (req, res) => {
  try {
    // Check if user is an animal owner
    if (req.user.userType !== 'owner') {
      return res.status(403).json({ msg: 'Only animal owners can access their medical records' });
    }

    // Find animals that belong to the user
    const animals = await Animal.find({ owner: req.user.id }).select('_id');

    const animalIds = animals.map(a => a._id);

    const records = await MedicalRecord.find({ animal: { $in: animalIds } })
      .populate('animal', 'name species breed')
      .populate('veterinarian', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;