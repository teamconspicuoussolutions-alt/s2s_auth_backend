const express = require('express');
const router = express.Router();
const prisma = require('../../prismaClient');
const authenticateToken = require('../../middleware/authMiddleware');

// =========================================================
// 1. GET PROFILE (Combine User + Address Data)
// =========================================================
router.get('/get-profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;

        // User fetch karo aur uska Default Address include karo
        const userProfile = await prisma.user.findUnique({
            where: { user_id: userId },
            include: {
                default_address: true // Address Table data layega
            }
        });

        if (!userProfile) return res.status(404).json({ error: "User not found" });

        // Address object nikalo (agar hai to)
        const addr = userProfile.default_address || {};

        // Frontend ke liye clean object banao
        const formattedProfile = {
            // -- User Table se --
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone,
            dob: userProfile.dob,
            bloodGroup: userProfile.blood_group,
            profile_image: userProfile.profile_image,

            // -- Address Table se (country bhi yahi se aayegi) --
            address: addr.address_line || "",
            city: addr.city || "",
            state: addr.state || "",
            pincode: addr.pin_code || "",
            country: addr.country || "India" // 👈 NEW FIELD FETCHED
        };

        res.json({ success: true, data: formattedProfile });

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// =========================================================
// 2. UPDATE PROFILE (Logic for User & Address)
// =========================================================
router.put('/update-profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        
        // Frontend se aane wala data
        const { 
            name, email, dob, bloodGroup, image,  // User Fields
            address, city, state, pincode, country // Address Fields (Country added)
        } = req.body;

        // 1. Check karo user ke paas Default Address ID hai kya?
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            select: { default_address_id: true }
        });

        let currentAddressId = user.default_address_id;

        // 2. Address Table Logic
        if (currentAddressId) {
            // CASE A: Address Hai -> Update karo
            await prisma.address.update({
                where: { address_id: currentAddressId },
                data: {
                    address_line: address,
                    city: city,
                    state: state,
                    pin_code: pincode,
                    country: country // 👈 Update Country
                }
            });
        } else {
            // CASE B: Address Nahi Hai -> Naya Banao
            // Tabhi banao agar user ne address ka kuch data diya ho
            if (address || city || state || pincode || country) {
                const newAddr = await prisma.address.create({
                    data: {
                        user_id: userId,
                        address_line: address || "",
                        city: city || "",
                        state: state || "",
                        pin_code: pincode || "",
                        country: country || "India", // 👈 Save Country
                        label: "Default"
                    }
                });
                currentAddressId = newAddr.address_id;
            }
        }

        // 3. User Table Logic (Update Basic Info & Link Address)
        await prisma.user.update({
            where: { user_id: userId },
            data: {
                name,
                email,
                dob,
                blood_group: bloodGroup,
                profile_image: image,
                default_address_id: currentAddressId // Link updated/new address
            }
        });

        res.json({ success: true, message: "Profile Updated Successfully" });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Could not update profile" });
    }
});

module.exports = router;
