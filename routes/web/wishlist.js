// s2s_auth_backend/routes/web/wishlist.js
const express = require("express");
const prisma = require("../../prismaClient");
const verifyToken = require("../../middleware/authMiddleware");



const router = express.Router();

/**
 * ✅ GET USER WISHLIST
 * GET /api/wishlist
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { limit, offset } = req.query; // Frontend se limit aur offset lein

    // 1. 🚀 Sabse Pehle Sari IDs mangwao (Heart Icons ke liye) - Super Fast
    const allWishlistEntries = await prisma.wishlist.findMany({
      where: { user_id: userId },
      select: { subcategory_id: true } // Sirf ID select karein
    });
    const allIds = allWishlistEntries.map(item => item.subcategory_id);

    // 2. 🚀 Ab Limited Data mangwao (Profile Page Card ke liye)
    const wishlist = await prisma.wishlist.findMany({
      where: { user_id: userId },
      take: limit ? parseInt(limit) : undefined,   // Kitne mangwane hain (e.g., 10)
      skip: offset ? parseInt(offset) : undefined, // Kitne chhodne hain (e.g., 0)
      select: {
        id: true,
        subcategory_id: true,
        // ⭐ Yahan humne sirf wahi fields select ki hain jo card mein chahiye
        subcategory: {
          select: {
            name: true,
            price: true,
            image_uri: true
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    res.json({ 
      success: true, 
      all_ids: allIds, // Sari IDs baki pages ke liye
      wishlist        // Limited data profile page ke liye
    });
  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist"
    });
  }
});


/**
 * ✅ ADD TO WISHLIST
 * POST /api/wishlist
 * body: { subcategory_id }
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub; // ✅ FIX
    const { subcategory_id } = req.body;

    if (!subcategory_id) {
      return res.status(400).json({
        success: false,
        message: "subcategory_id is required"
      });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        user_id: userId,
        subcategory_id
      }
    });

    res.status(201).json({
      success: true,
      message: "Added to wishlist",
      wishlistItem
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Item already in wishlist"
      });
    }

    console.error("ADD WISHLIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add wishlist item"
    });
  }
});

/**
 * ✅ REMOVE FROM WISHLIST
 * DELETE /api/wishlist/:subcategoryId
 */
router.delete("/:subcategoryId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub;   // ✅ FIXED
    const { subcategoryId } = req.params;

    await prisma.wishlist.delete({
      where: {
        user_id_subcategory_id: {
          user_id: userId,
          subcategory_id: subcategoryId
        }
      }
    });

    res.json({
      success: true,
      message: "Removed from wishlist"
    });
  } catch (error) {
    console.error("DELETE WISHLIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove wishlist item"
    });
  }
});


module.exports = router;


