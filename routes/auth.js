import express from "express";
import handel_validation_errors from "../middleware/handelBodyError.js";
import {
  checkOtp,
  forgetPassword,
  login,
  refererGift,
  registerController,
  resetPassword,
  socialLogin,
  verifyEmailController,
  welcomeGift,
} from "../controllers/auth.js";
import {
  checkOtpValidation,
  forgetPasswordValidation,
  loginUserValidation,
  resetPasswordValidation,
} from "../validation/user.js";
import {
  validateRegisterInput,
  validateVerifyEmailInput,
} from "../validation/auth.js";

const router = express.Router();

router.post("/register", validateRegisterInput, registerController);

router.post("/verify/email", validateVerifyEmailInput, verifyEmailController);

router.post("/login", loginUserValidation(), handel_validation_errors, login);

router.post(
  "/forget-password",
  forgetPasswordValidation(),
  handel_validation_errors,
  forgetPassword
);

router.post(
  "/verify-otp",
  checkOtpValidation(),
  handel_validation_errors,
  checkOtp
);

router.post(
  "/reset-password",
  resetPasswordValidation(),
  handel_validation_errors,
  resetPassword
);

router.post("/social-login", socialLogin);

router.get("/welcome-gift", welcomeGift);

router.get("/referral-gift", refererGift);

export default router;
