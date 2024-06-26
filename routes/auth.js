import express from "express";
import handel_validation_errors from "../middleware/handelBodyError.js";
import {
  registerController,
  verifyEmailController,
  loginController,
  refreshTokenController,
  checkOtp,
  forgetPassword,
  refererGift,
  resetPassword,
  socialLogin,
  welcomeGift,
} from "../controllers/auth.js";
import {
  checkOtpValidation,
  forgetPasswordValidation,
  resetPasswordValidation,
} from "../validation/user.js";
import {
  validateLoginInput,
  validateRefreshTokenInput,
  validateRegisterInput,
  validateVerifyEmailInput,
} from "../validation/auth.js";

const router = express.Router();

router.post("/register", validateRegisterInput, registerController);

router.post("/verify/email", validateVerifyEmailInput, verifyEmailController);

router.post("/login", validateLoginInput, loginController);

router.post(
  "/refresh/token",
  validateRefreshTokenInput,
  refreshTokenController
);

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
