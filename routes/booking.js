// s2s_auth_backend/routes/web/booking.js
const express = require('express');
const router = express.Router();
const prisma = require('../../prismaClient');
const authenticateToken = require('../../middleware/auth');

// --- 1. Price Fetcher (Step 4 ke liye) ---
router.get('/get-unit-price', authenticateToken, async (req, res) => {
  const { subId, subSubId } = req.query;
  try {
    let pricingInfo = null;
    // Pehle Sub-Sub-Category check karein (Specific price)
    if (subSubId && subSubId !== 'undefined') {
      pricingInfo = await prisma.subSubCategory.findUnique({
        where: { id: parseInt(subSubId) },
        select: { price: true }
      });
    } 
    // Agar Sub-Sub nahi hai, toh Sub-Category check karein
    else if (subId && subId !== 'undefined') {
      pricingInfo = await prisma.subCategory.findUnique({
        where: { id: parseInt(subId) },
        select: { price: true }
      });
    }

    if (pricingInfo) {
      return res.json({ success: true, unitPrice: pricingInfo.price });
    }
    res.json({ success: true, unitPrice: 0, message: "Price not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
