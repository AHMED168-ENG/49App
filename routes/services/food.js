import express from "express";
import food_model from "../../models/food_model.js";

/*-------------------Middleware-------------------*/
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

/*-------------------Controllers-------------------*/
import {
  createRestuarant,
  deleteRestuarant,
  getRestaurantById,
  getRestaurantItems,
  addRestaurantItem,
  deleteRestaurantItem,
  getRestaurantsCategory,
  updateRestaurantItem,
  updateRestaurantInfo,
} from "../../controllers/food/restuarant_controller.js";
import {
  createOrder,
  createRateOrder,
  deleteRateOrder,
  getUserOrders,
  getRestaurantOrders,
} from "../../controllers/food/order_controller.js";

import {
  validationRegisterRestaurant,
  validationUpdateRestaurant,
  validationAddRestaurantItem,
  validationUpdateRestaurantItem,
  validationCreateOrder,
  validationCreateRateOrder,
  validationDeleteRateOrder,
} from "../../validation/food_validation.js";

const router = express.Router();

/*------------------- Apply Universal Middleware to All Routes -------------------*/
router.use(isAuthenticated);
router.use(isAuthorized(["user", "admin", "super_admin"]));

router.get("/restaurants/:categoryId", getRestaurantsCategory);
router.get("/food-items/:restaurantId", getRestaurantItems);
router.get("/get-restaurant-orders", getRestaurantOrders);
router.get("/get-restaurant/:id", getRestaurantById);
router.get("/get-user-orders", getUserOrders);

router.post("/rating-order", validationCreateRateOrder, createRateOrder);
router.post("/add-food", validationAddRestaurantItem, addRestaurantItem);
router.post("/register", validationRegisterRestaurant, createRestuarant);
router.post("/make-order", validationCreateOrder, createOrder);

router.delete("/delete-registration", deleteRestuarant);
router.delete("/delete-rating", validationDeleteRateOrder, deleteRateOrder);
// modified from "/delete-food-item" to "/delete-food-item/:id"
router.delete("/delete-food-item/:id", deleteRestaurantItem);
// new route -> refactor ver. 0.1
router.put(
  "/update-restaurant-info",
  validationUpdateRestaurant,
  updateRestaurantInfo
);
// modified from "/update-restuarant-item" to "/update-restuarant-item/:id"
router.put(
  "/update-restuarant-item/:id",
  validationUpdateRestaurantItem,
  updateRestaurantItem
);

/*-------------------Note-------------------
 * Need discussion with team
/*-----------------------------------------*/
router.get("/foods", async (req, res, next) => {
  try {
    const result = await food_model.find({
      restaurant_id: req.user.id,
      is_approved: true,
    });

    res.json({
      status: true,
      data: result,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
});

export default router;
