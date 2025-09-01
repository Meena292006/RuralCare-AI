const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users → Create new user
router.post('/', async (req, res) => {
  console.log('POST /api/users body:', req.body);
  try {
    const { uid, email, firstTime, language, history } = req.body;
    const user = new User({ uid, email, firstTime, language, history });
    await user.save();
    console.log('User saved:', user);
    res.status(201).json(user);
  } catch (err) {
    console.error('User creation failed:', err);
    res.status(400).json({ message: 'User creation failed', error: err.message });
  }
});

// GET /api/users/:uid → Get user by UID
router.get('/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
});

// PUT /api/users/:uid → Update user (any fields)
router.put('/:uid', async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findOneAndUpdate({ uid: req.params.uid }, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    console.log(`User ${req.params.uid} updated:`, user);
    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
});

module.exports = router;
