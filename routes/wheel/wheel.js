import express from "express";
import { validateCreateWheelInput, validateGetWheelInput } from "../../validation/wheel/wheel.js";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";
import {
  createWheelController,
  getWheelController,
} from "../../controllers/wheel/wheel.js";

const router = express.Router();

router.post(
  "/",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateCreateWheelInput,
  createWheelController
);

router.get(
  "/:wheelId",
  isAuthenticated,
  isAuthorized(["super_admin", "admin", "user"]),
  validateGetWheelInput,
  getWheelController
);

export default router;
