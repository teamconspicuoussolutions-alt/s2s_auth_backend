// backend/otpStore.js
const prisma = require('./prismaClient');

async function saveOtp(phone, otp, ttlSeconds) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  
  await prisma.otp.upsert({
    where: { phone },
    update: { code: otp, expiresAt },
    create: { phone, code: otp, expiresAt }
  });
}

async function verifyOtp(phone, code) {
  // 🔥 HARDCODE LOGIC: Agar OTP '123456' hai, to direct pass!
  if (code === '123456') {
    console.log(`🔓 Bypassing verification for ${phone} with Master OTP.`);
    return true;
  }

  // --- Original Logic (Real OTP ke liye) ---
  const record = await prisma.otp.findUnique({ where: { phone } });
  if (!record) return false;

  if (new Date() > record.expiresAt) {
    await prisma.otp.delete({ where: { phone } }).catch(() => {});
    return false;
  }

  const ok = record.code === code;
  if (ok) {
    await prisma.otp.delete({ where: { phone } }).catch(() => {});
  }

  return ok;
}

async function cleanupExpiredOtps() {
  await prisma.otp.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

module.exports = { saveOtp, verifyOtp, cleanupExpiredOtps };