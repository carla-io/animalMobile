const express = require('express');
const router = express.Router();
const Animal = require('../models/Animals');

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'animal-profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

const upload = multer({ storage });

// ✅ GET all animals
router.get('/getAll', async (req, res) => {
  try {
    const animals = await Animal.find();
    res.status(200).json({ success: true, animals });
  } catch (error) {
    console.error('Error fetching animals:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Add new animal with image upload
router.post('/add', upload.single('photo'), async (req, res) => {
  try {
    const { name, species, breed, age, owner, status } = req.body;

    let photoUrl = '';
    if (req.file && req.file.path) {
      photoUrl = req.file.path; // ✅ this is the actual Cloudinary image URL
    }

    const newAnimal = await Animal.create({
      name,
      species,
      breed,
      age,
      owner,
      status,
      photo: photoUrl, // ✅ store real URL
    });

    res.status(201).json({ success: true, animal: newAnimal });
  } catch (error) {
    console.error('Error adding animal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ✅ Count all animals
router.get('/count', async (req, res) => {
  try {
    const count = await Animal.countDocuments();
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error counting animals:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ Get single animal by ID
router.get('/:id', async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });
    res.status(200).json({ success: true, animal });
  } catch (error) {
    console.error('Error fetching animal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update animal (with optional photo update)
router.put('/update/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.photo = req.file.path;
    }

    const updated = await Animal.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    res.json({ success: true, animal: updated });
  } catch (err) {
    console.error('Failed to update animal:', err);
    res.status(400).json({ success: false, message: 'Failed to update animal', error: err.message });
  }
});

// ✅ Delete animal
router.delete('/delete/:id', async (req, res) => {
  try {
    const animal = await Animal.findByIdAndDelete(req.params.id);

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    res.status(200).json({ success: true, message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Error deleting animal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
