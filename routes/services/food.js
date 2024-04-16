import express from "express";
import food_model from "../../models/food_model.js";

/*-------------------Middleware-------------------*/
import { verifyToken } from "../../helper.js";

/*-------------------Controllers-------------------*/
import {
  createRestuarant,
  deleteRestuarant,
  updateRestaurantInfo,
  getRestaurantById,
  getRestaurantItems,
  addRestaurantItem,
  deleteRestaurantItem,
  getRestaurantsCategory,
} from "../../controllers/food/restuarant_controller.js";
import {
  createOrder,
  createRateOrder,
  deleteRateOrder,
  getUserOrders,
  getRestaurantOrders,
} from "../../controllers/food/order_controller.js";

const router = express.Router();

/*------------------- Apply Universal Middleware to All Routes -------------------*/
router.use(verifyToken);

router.get("/restaurants/:categoryId", getRestaurantsCategory);
router.get("/get-restaurant-orders", getRestaurantOrders);
router.get("/get-restaurant/:id", getRestaurantById);
router.get("/get-user-orders", getUserOrders);

router.post("/rating-order", createRateOrder);
router.post("/add-food", addRestaurantItem);
router.post("/register", createRestuarant);
router.post("/make-order", createOrder);

router.delete("/delete-registration", deleteRestuarant);
router.delete("/delete-food-item", deleteRestaurantItem);
router.delete("/delete-rating", deleteRateOrder);

router.put("/update-info", updateRestaurantInfo);

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
/*-------------------Note-------------------
 * Need discussion with team
/*-----------------------------------------*/
router.get("/food-items/:restaurantId", async (req, res, next) => {
  try {
    const result = await food_model.find({
      restaurant_id: req.params.restaurantId,
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
