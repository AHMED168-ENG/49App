import express from "express";

import {
  deleteActivity,
  deleteAllActivities,
  getAppActivities,
  getServiceActivities,
  getSocialActivities,
  getUnreadActivitiesCount,
  getUnreadActivitiesCountByType,
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

router.post("/set-as-read", validateSetAsReadActivity, setActivityRead);
router.get("/count-by-type", getUnreadActivitiesCountByType);
router.get("/count", getUnreadActivitiesCount);
router.get("/service", getServiceActivities);
router.get("/social", getSocialActivities);
router.get("/app", getAppActivities);

router.delete("/:id", deleteActivity);
router.delete("/all/:tab", deleteAllActivities);


export default router;
