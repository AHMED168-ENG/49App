const generateOtp = (length) => {
  const numbers = "0123456789";

  let OTP = "";

  for (let index = 0; index < length; index++) {
    OTP += numbers[Math.floor(Math.random() * 10)];
  }

  return OTP;
};

export { generateOtp };
