const express = require('express');
const router = express.Router();
const prisma = require('../../prismaClient');
const authenticateToken = require('../../middleware/authMiddleware');

// 🔹 GET MEMBERS
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.sub;

  const members = await prisma.member.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' }
  });

  res.json({ success: true, data: members });
});

// 🔹 ADD MEMBER
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const { name, phone, dob, bloodGroup } = req.body;

  const member = await prisma.member.create({
    data: {
      user_id: userId,
      name,
      phone,
      dob,
      blood_group: bloodGroup
    }
  });

  // Allowed number auto add
  if (phone) {
    await prisma.allowedNumber.create({
      data: {
        phone_number: phone,
        user_id: userId,
        member_id: member.member_id
      }
    });
  }

  res.json({ success: true, data: member });
});

module.exports = router;

