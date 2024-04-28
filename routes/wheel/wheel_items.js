import express from "express";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

import {
  validateCreateWheelItemInput,
  validateGetWheelItemsInput,
  validateUpdateWheelItemInput,
} from "../../validation/wheel/wheel_items.js";

import {
  createWheelItemController,
  getWheelItemsController,
  updateWheelItemController,
} from "../../controllers/wheel/wheel_item.js";

const router = express.Router();

// body: [ wheelId , name , value , type , percentage , isActive ]
router.post(
  "/:wheelId/items",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateCreateWheelItemInput,
  createWheelItemController
);

// action: get wheel items by wheel id
// params: [ wheelId ]
router.get(
  "/:wheelId/items",
  isAuthenticated,
  isAuthorized(["super_admin", "admin", "user"]),
  validateGetWheelItemsInput,
  getWheelItemsController
);

// action: get wheel item by item id
// params: [ wheelId , itemId ]
router.get("/wheel-items/:itemId");

// action: update wheel item
// body: [ wheelId , name , value , type , percentage , isActive ]
router.put(
  "/items/:itemId",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateUpdateWheelItemInput,
  updateWheelItemController
);

// action: delete wheel item by item id
router.delete("/wheel-items/:itemId");

// action: delete many wheel items by wheel id
// body [ wheelsIds: [ "", "", "" ] ]
router.delete("/wheel-items");

export default router;
