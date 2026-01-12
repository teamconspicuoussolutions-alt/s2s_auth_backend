
const express = require("express");
const router = express.Router();
const prisma = require("../../prismaClient");

// 🔐 SECURITY: sirf GitHub Actions
router.post("/expire-subscriptions", async (req, res) => {
  console.log("=== CRON DEBUG ===");
  const headerSecret = (req.headers["x-cron-secret"] || "").trim();
  const envSecret = (process.env.CRON_SECRET || "").trim();
  
  if (headerSecret !== envSecret) {
  return res.status(401).json({ error: "Unauthorized" });
 }
  console.log("✅ SECRET MATCHED");


  try {
    const now = new Date();

    // 1️⃣ Sirf expired + active subscriptions lao
    const expiredSubs = await prisma.subscribedUser.findMany({
      where: {
        end_date: { lt: now },
        status: "active"
      },
      select: {
        user_id: true
      }
    });

    if (expiredSubs.length === 0) {
      return res.json({
        success: true,
        message: "No expired subscriptions"
      });
    }

    // 2️⃣ User IDs extract karo
    const userIds = expiredSubs.map(s => s.user_id);

    // 3️⃣ BATCH TRANSACTION (NO LOOPS)
    await prisma.$transaction([

      // 🔴 SubscribedUser → expired
      prisma.subscribedUser.updateMany({
        where: {
          user_id: { in: userIds }
        },
        data: {
          status: "expired"
        }
      }),

      // 🔴 User → inactive
      prisma.user.updateMany({
        where: {
          user_id: { in: userIds }
        },
        data: {
          plan_status: "inactive"
        }
      }),

      // 🔴 Members → inactive
      prisma.member.updateMany({
        where: {
          user_id: { in: userIds }
        },
        data: {
          plan_status: "inactive"
        }
      }),

      // 🔴 Addresses → inactive
      prisma.address.updateMany({
        where: {
          user_id: { in: userIds }
        },
        data: {
          plan_status: "inactive"
        }
      })

    ]);

    res.json({
      success: true,
      expiredUsers: userIds.length
    });

  } catch (error) {
    console.error("Expire cron error:", error);
    res.status(500).json({ error: "Cron job failed" });
  }
});

module.exports = router;
