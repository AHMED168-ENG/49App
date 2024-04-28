import express from "express";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

import {
  validateCreateWheelInput,
  validateGetWheelInput,
  validateGetWheelsInput,
} from "../../validation/wheel/wheel.js";

import {
  createWheelController,
  getWheelController,
  getWheelsController,
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

router.get(
  "/",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateGetWheelsInput,
  getWheelsController
);

export default router;
