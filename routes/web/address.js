// routes/web/address.js
const express = require('express');
const router = express.Router();
const prisma = require('../../prismaClient');
const authenticateToken = require('../../middleware/authMiddleware');

// 🔹 GET ALL ADDRESSES
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id; // Auth context ke according
    const addresses = await prisma.address.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' }
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Address fetch error" });
  }
});

// 🔹 ADD NEW ADDRESS
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const { houseNo, area, city, state, pincode, label, customLabel } = req.body;

  const count = await prisma.address.count({ where: { user_id: userId } });
  if (count >= 3) {
    return res.status(400).json({ error: "Max 3 addresses allowed" });
  }

  const address = await prisma.address.create({
    data: {
      user_id: userId,
      address_line: `${houseNo}, ${area}`,
      city,
      state,
      pin_code: pincode,
      country: "India",
      label: label === "Other" ? customLabel : label
    }
  });

  res.json({ success: true, data: address });
});

module.exports = router;

