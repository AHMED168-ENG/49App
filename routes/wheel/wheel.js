import express from "express";
import { validateCreateWheelInput } from "../../validation/wheel/wheel.js";
import { createWheelController } from "../../controllers/wheel/wheel.js";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

const router = express.Router();

router.post(
  "/",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateCreateWheelInput,
  createWheelController
);

export default router;
