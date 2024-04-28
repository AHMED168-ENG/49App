import express from "express";
import { validateCreateWheelItemInput } from "../../validation/wheel/wheel_items.js";
import { createWheelItemController } from "../../controllers/wheel/wheel_item.js";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

const router = express.Router();

// body: [ wheelId , name , value , type , percentage , isActive ]
router.post(
  "/:wheelId/items",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateCreateWheelItemInput,
  createWheelItemController
);

// action: get all wheel items by wheel id
// params: [ wheelId ]
router.get("/wheel-items/");

// action: get wheel item by item id
// params: [ wheelId , itemId ]
router.get("/wheel-items/:itemId");

// action: update wheel item
// body: [ wheelId , name , value , type , percentage , isActive ]
router.put("/wheel-items/:itemId");

// action: delete wheel item by item id
router.delete("/wheel-items/:itemId");

// action: delete many wheel items by wheel id
// body [ wheelsIds: [ "", "", "" ] ]
router.delete("/wheel-items");

export default router;
