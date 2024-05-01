import express from "express";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

import {
  validateCreateWheelItemInput,
  validateDeleteWheelItemInput,
  validateGetWheelItemInput,
  validateGetWheelItemsInput,
  validateUpdateWheelItemInput,
} from "../../validation/wheel/wheel_items.js";

import {
  createWheelItemController,
  deleteWheelItemController,
  getWheelItemController,
  getWheelItemsController,
  updateWheelItemController,
} from "../../controllers/wheel/wheel_item.js";

const router = express.Router();

router.post(
  "/:wheelId/items",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateCreateWheelItemInput,
  createWheelItemController
);

router.get(
  "/:wheelId/items",
  isAuthenticated,
  isAuthorized(["super_admin", "admin", "user"]),
  validateGetWheelItemsInput,
  getWheelItemsController
);

router.get(
  "/items/:itemId",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateGetWheelItemInput,
  getWheelItemController
);

router.put(
  "/items/:itemId",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateUpdateWheelItemInput,
  updateWheelItemController
);

router.delete(
  "/items/:itemId",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateDeleteWheelItemInput,
  deleteWheelItemController
);

export default router;
