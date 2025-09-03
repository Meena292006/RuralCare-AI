const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/hospitals/nearby?lat=..&lng=..&radius=..
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const url = `https://us1.locationiq.com/v1/nearby.php?key=${process.env.LOCATIONIQ_KEY}&lat=${lat}&lon=${lng}&tag=hospital&radius=${radius}&format=json`;

    const r = await axios.get(url);

    // Normalize response into a simple format
    const hospitals = r.data.map((h, i) => ({
      _id: i,
      name: h.name || 'Unnamed Hospital',
      address: h.address?.road || h.address?.name || 'Address not available',
      location: {
        type: 'Point',
        coordinates: [parseFloat(h.lon), parseFloat(h.lat)]
      }
    }));

    res.json(hospitals);
  } catch (err) {
    console.error('LocationIQ error:', err.message);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

module.exports = router;
