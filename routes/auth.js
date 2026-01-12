// s2s_auth_backend/routes/auth.js
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
  try {
    const userId = req.user.sub;
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        name: true,
        plan_status: true,
        subscription: {
          select: {
            end_date: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 🔥 RUNTIME CHECK (READ ONLY)
    let effectivePlanStatus = user.plan_status;

    if (
      user.subscription &&
      now > user.subscription.end_date
    ) {
      effectivePlanStatus = "inactive";
    }

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        plan_status: effectivePlanStatus
      }
    });

  } catch (err) {
    console.error("Verify token error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});


module.exports = router;


