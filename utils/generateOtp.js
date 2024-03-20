import crypto from 'crypto';

export function generateOtp(length) {
  const chars = '01234567890123456789';
  const charsLength = chars.length;
  let otp = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charsLength);
    otp += chars[randomIndex];
  }
  return otp;
}
