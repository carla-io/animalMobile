const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const Animal = require('../models/Animals');


// GET /user/profile - Get authenticated user's profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Construct the user profile response
    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      profilePhoto: user.profilePhoto,
    };

    // Include licenseNumber only if user is a vet
    if (user.userType === 'vet') {
      userProfile.licenseNumber = user.licenseNumber;
    }

    return res.status(200).json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Profile Fetch Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error fetching profile'
    });
  }
});


 router.get('/getAll', async (req, res) => {
        try {
            const users = await User.find({}, '-password'); // exclude password field
            res.status(200).json({ success: true, users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });



    router.get('/countUsersOnly', async (req, res) => {
  try {
    const count = await User.countDocuments({ userType: 'user' });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error counting user-type users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// GET all users with their assigned tasks ************

// router.get('/tasks/all', async (req, res) => {
//   try {
//     const usersWithTasks = await User.find()
//       .select('name email userType') // select only useful fields
//       .lean(); // use lean for performance

//     // For each user, fetch tasks assigned to them
//     const results = await Promise.all(
//       usersWithTasks.map(async (user) => {
//         const tasks = await Task.find({ assignedTo: user._id })
//           .populate('animalId', 'name species')
//           .lean();

//         return {
//           ...user,
//           tasks,
//         };
//       })
//     );

//     res.json(results);
//   } catch (error) {
//     console.error('Error fetching tasks per user:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.get('/getAllUsersOnly', async (req, res) => {
  try {
    const users = await User.find({ userType: 'user' }, '-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching user-type users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET only users with userType = 'vet'
router.get('/getAllVetsOnly', async (req, res) => {
  try {
    const vets = await User.find({ userType: 'vet' }, '-password');
    res.status(200).json({ success: true, users: vets });
  } catch (error) {
    console.error('Error fetching vet-type users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/vet/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the vet by ID and userType
    const vet = await User.findOne({ _id: id, userType: 'vet' }, '-password');

    if (!vet) {
      return res.status(404).json({
        success: false,
        message: 'Vet not found'
      });
    }

    res.status(200).json({
      success: true,
      user: vet
    });
  } catch (error) {
    console.error('Error fetching vet by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

router.get('/vet/:id/assigned-animals', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Find all animals assigned to this vet
    const assignedAnimals = await Animal.find({ vetId: id })
      .populate('vetId', 'name email'); // only populate vet if needed

    res.status(200).json({
      success: true,
      animals: assignedAnimals
    });
  } catch (error) {
    console.error('Error fetching assigned animals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned animals.'
    });
  }
});


module.exports = router;