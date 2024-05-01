import { validateUpdateWalletAmountInput } from "../../validation/competition_wallet.js";
import { updateWalletAmountController } from "../../controllers/dashboard/wallet.js";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";
import express from "express";

const router = express.Router();

router.put(
  "/:walletId",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateUpdateWalletAmountInput,
  updateWalletAmountController
);

export default router;
