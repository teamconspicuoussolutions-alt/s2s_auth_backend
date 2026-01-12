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
    const userId = req.user.user_id;

    const wishlist = await prisma.wishlist.findMany({
      where: { user_id: userId },
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    res.status(200).json({
      success: true,
      wishlist
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
    const userId = req.user.user_id;
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
    // Duplicate wishlist (unique constraint)
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
    const userId = req.user.user_id;
    const { subcategoryId } = req.params;

    await prisma.wishlist.delete({
      where: {
        user_id_subcategory_id: {
          user_id: userId,
          subcategory_id: subcategoryId
        }
      }
    });

    res.status(200).json({
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


