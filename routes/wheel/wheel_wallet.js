import express from "express";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

import {
  validateGetWheelWalletInput,
  validateGetWheelWalletsInput,
} from "../../validation/wheel/wheel_wallet.js";

import {
  getWalletsController,
  getWheelWalletController,
} from "../../controllers/wheel/wheel_wallet.js";

const router = express.Router();

router.get(
  "/wallets/:walletId",
  isAuthenticated,
  isAuthorized(["super_admin", "admin", "user"]),
  validateGetWheelWalletInput,
  getWheelWalletController
);

router.get(
  "/wallets",
  isAuthenticated,
  isAuthorized(["super_admin", "admin", "user"]),
  validateGetWheelWalletsInput,
  getWalletsController
);

export default router;
