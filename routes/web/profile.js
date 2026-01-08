// s2s_auth_backend/routes/web/profile.js
const express = require('express');
const router = express.Router();
const prisma = require('../../prismaClient');
const authenticateToken = require('../../middleware/authMiddleware');

router.get('/get-profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;

        
        const userProfile = await prisma.user.findUnique({
            where: { user_id: userId }
        });

        if (!userProfile) return res.status(404).json({ error: "User not found" });

        // Frontend ke liye clean object banao
        const formattedProfile = {
            // -- User Personal Data --
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone,
            dob: userProfile.dob,
            bloodGroup: userProfile.blood_group,
            profile_image: userProfile.profile_image,
            city: userProfile.city || "",
            state: userProfile.state || "",
            pincode: userProfile.pin_code || "",
            country: userProfile.country || "India"
        };

        res.json({ success: true, data: formattedProfile });

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// =========================================================
// 2. UPDATE PROFILE (Direct to User Table)
// =========================================================
router.put('/update-profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        
        const { 
            name, email, dob, bloodGroup, image, 
            city, state, pincode, country 
        } = req.body;

     
        await prisma.user.update({
            where: { user_id: userId },
            data: {
                name,
                email,
                dob,
                blood_group: bloodGroup,
                profile_image: image,
                
                // Direct Location Update
                city: city,
                state: state,
                pincode: pin_code,
                country: country
            }
        });

        res.json({ success: true, message: "Profile Updated Successfully" });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Could not update profile" });
    }
});

module.exports = router;



