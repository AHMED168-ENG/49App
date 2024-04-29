import express from "express";
import { validateGetWheelWalletInput } from "../../validation/wheel/wheel_wallet.js";
import { getWheelWalletController } from "../../controllers/wheel/wheel_wallet.js";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

const router = express.Router();

router.get(
  "/wallets",
  isAuthenticated,
  isAuthorized(["super_admin", "admin", "user"]),
  validateGetWheelWalletInput,
  getWheelWalletController
);

export default router;
