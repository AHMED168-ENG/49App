import express from "express";
import notification_model from "../models/notification_model.js";


import {
  deleteActivity,
  getAppActivities,
  getServiceActivities,
  getSocialActivities,
  setActivityRead,
} from "../controllers/activity_controller.js";

/*-------------------Middleware-------------------*/
import { isAuthenticated } from "../middleware/is-authenticated.js";
import { isAuthorized } from "../middleware/is-authorized.js";

// Validation
import { validateSetAsReadActivity } from "../validation/activity.js";

const router = express.Router();

/*------------------- Apply Universal Middleware to All Routes -------------------*/
router.use(isAuthenticated);
router.use(isAuthorized(["user", "admin", "super_admin"]));

router.get("/social", getSocialActivities);
router.get("/service", getServiceActivities);
router.get("/app", getAppActivities);
router.post(
  "/set-as-read",
  validateSetAsReadActivity,
  setActivityRead
);

router.delete("/:id", deleteActivity);

router.delete("/all/:tab", async (req, res, next) => {
  try {
    await notification_model.deleteMany({
      tab: req.params.tab,
      receiver_id: req.user.id,
    });

    res.json({
      status: true,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/count", async (req, res, next) => {
  try {
    const result = await notification_model
      .find({ receiver_id: req.user.id, is_read: false })
      .count();

    res.json({
      status: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/count-by-type", async (req, res, next) => {
  try {
    const result = await Promise.all([
      notification_model
        .find({ receiver_id: req.user.id, is_read: false, tab: 1 })
        .count(),
      notification_model
        .find({ receiver_id: req.user.id, is_read: false, tab: 2 })
        .count(),
      notification_model
        .find({ receiver_id: req.user.id, is_read: false, tab: 3 })
        .count(),
    ]);

    res.json({
      status: true,
      data: {
        social: result[0],
        service: result[1],
        app: result[2],
      },
    });
  } catch (e) {
    next(e);
  }
});
export default router;
