const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createId } = require('@paralleldrive/cuid2');
const prisma = require('../prismaClient');
const authenticateToken = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET;


// 1. Check User (Fast Query)
router.get('/check-user', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { phone: true } 
    });

    return res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Register
router.post('/register', async (req, res) => {
  try {
    const { phone, otp, password, name } = req.body;
    if (otp !== '123456') return res.status(401).json({ error: 'Invalid OTP' });

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const sharedId = createId();
    const user = await prisma.user.create({
      data: { user_id: sharedId, phone, password: hashedPassword, name: name || "User" }
    });

    const token = jwt.sign({ sub: user.user_id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 3. Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: user.user_id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 4. Verify Token (For Page Refresh)
router.get('/verify-token', authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { user_id: req.user.sub },
    select: { user_id: true, name: true, plan_status: true }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user });
});

module.exports = router;
