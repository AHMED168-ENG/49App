import {
  validateGetSubscriberByIdInput,
  validateGetSubscribersInput,
} from "../../validation/competition/subscriber.js";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";
import {
  getSubscriberByIdController,
  getSubscribersController,
} from "../../controllers/dashboard/subscriber.js";

import express from "express";

const router = express.Router();

router.get(
  "/subscribers",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateGetSubscribersInput,
  getSubscribersController
);

// get specific subscriber by id by super admin
/*
        1- name
        1- email
        1- phone
        1- wallet
        1- status
        1- counter
        1- isBlocked/fraud
        1- all competitions that user subscribed to (include competitions name, category name, pricePer request, start_date, end_date, status)
     */
router.get(
  "/subscribers/:subscriberId",
  isAuthenticated,
  isAuthorized(["super_admin"]),
  validateGetSubscriberByIdInput,
  getSubscriberByIdController
);

// super admin can delete remove or block or fraud any user from the system by this route
router.put(
  "/dashboard/subscriptions/:subscriberId",
  isAuthenticated,
  isAuthorized(["super_admin"])
);

export default router;
