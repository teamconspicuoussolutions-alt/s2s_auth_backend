// s2s_auth_backend/routes/web/subscription.js
const express = require('express');
const router = express.Router();
const prisma = require('../../prismaClient');
const authenticateToken = require('../../middleware/authMiddleware');

// =========================================================
// 1. SAVE PERSONAL DETAILS (Step 1 -> Next)
// =========================================================
router.post('/save-personal-details', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        const { name, email, dob, bloodGroup } = req.body;

        // Step 1 ka data User table me save/update karo
        await prisma.user.update({
            where: { user_id: userId },
            data: {
                name,
                email,
                dob,
                blood_group: bloodGroup
            }
        });

        res.json({ success: true, message: "Personal details saved" });
    } catch (error) {
        console.error("Save Personal Error:", error);
        res.status(500).json({ error: "Failed to save details" });
    }
});

// =========================================================
// 2. ACTIVATE SUBSCRIPTION (Step 4 -> Final Payment)
// =========================================================
router.post('/activate-subscription', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        const { addresses, members, planName, amount, razorpayOrderId, razorpayPaymentId } = req.body;

        // TRANSACTION: Sab kuch ek saath save hoga
        await prisma.$transaction(async (tx) => {
            
            // 1. User ka Plan Status Active karo
            await tx.user.update({
                where: { user_id: userId },
                data: { plan_status: "active" }
            });

            // 2. Subscription Record Banao
            await tx.subscribedUser.create({
                data: {
                    user_id: userId,
                    plan_name: planName || "S2S Premium",
                    amount: parseFloat(amount) || 0,
                    start_date: new Date(),
                    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 Year validity
                    status: "active",
                    order_id: razorpayOrderId, 
                    payment_id: razorpayPaymentId
                }
            });

            // 3. Addresses Save karo (Loop)
            const validAddresses = addresses.filter(a => a.city && a.pincode);
            if (validAddresses.length > 0) {
                await tx.address.createMany({
                    data: validAddresses.map(addr => ({
                        user_id: userId, // Main User ki ID
                        address_line: `${addr.houseNo}, ${addr.area}`, // Combine House & Area
                        city: addr.city,
                        state: addr.state,
                        country: "India",
                        pin_code: addr.pincode,
                        label: addr.label === "Other" ? addr.customLabel : addr.label
                    }))
                });
            }

            // 4. Members & Allowed Numbers Save karo
            // Yahan 'members' list mein Main User + Family sab honge
            for (const member of members) {
                
                // A. Member Table mein entry
                const newMember = await tx.member.create({
                    data: {
                        user_id: userId, // Reference: Kisne add kiya (Main User ID)
                        name: member.name,
                        phone: member.phone,
                        dob: member.dob,
                        blood_group: member.bloodGroup
                    }
                });

                // B. Allowed Number Table mein entry
                if (member.phone) {
                    await tx.allowedNumber.create({
                        data: {
                            phone_number: member.phone,
                            user_id: userId, // Main User ID (Owner)
                            member_id: newMember.member_id // Linked Member ID
                        }
                    });
                }
            }
        });

        res.json({ success: true, message: "Subscription Activated Successfully!" });

    } catch (error) {
        console.error("Activation Error:", error);
        // Duplicate number error handle karne ke liye
        if (error.code === 'P2002') {
             return res.status(400).json({ error: "One of the phone numbers is already registered." });
        }
        res.status(500).json({ error: "Activation failed. Please contact support." });
    }
});

module.exports = router;
