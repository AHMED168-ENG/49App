import express from "express";

/*-------------------Middleware-------------------*/
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

/*-------------------Validation-------------------*/
import {
  createCompetitionValidation,
  updateCompetitionValidation,
} from "../../validation/competitions_validation.js";
import {
  createCompetitionController,
  getCompetitionByIdController,
  getCompetitionsController,
  updateCompetitionController,
} from "../../controllers/dashboard/competition.js";

const router = express.Router();

router.use(isAuthenticated);
router.use(isAuthorized(["super_admin"]));

/*-------------------Super Admin-------------------*/
// create new competition by super admin
router.post(
  "/",
  createCompetitionValidation,
  createCompetitionController
);

// get all competitions by super admin active and inactive -> if there is any query string it will be for active competitions only
// router.get("/competitions?active", isAuthenticated, isAuthorized(["super_admin"])); -> return active competitions only
// router.get("/competitions?inactive", isAuthenticated, isAuthorized(["super_admin"])); -> return inactive competitions only
/*
  1- competition id
  1- competition name
  1- category name (by category id)
  1- pricePer request
  1- maxSubscribers
  1- currentSubscribers -> count of subscribers from subscriptions schema by competition id
  1- start_date
  1- end_date
  1- active or inactive (status)
 */
router.get("/", getCompetitionsController);

// get competition by id by super admin active and inactive
/*
    1- competition id
    1- competition name
    1- category name (by category id)
    1- pricePer request
    1- maxSubscribers
    1- currentSubscribers -> count of subscribers from subscriptions schema by competition id
    1- start_date
    1- end_date
    1- active or inactive (status)
    1- all subscribers for this competition (include user name, email, phone, wallet, status , counter , isBlocked/fraud)
 */
router.get("/:competitionId" , getCompetitionByIdController);

// update competition by id by super admin  -> name , description , start_date , end_date , price , max_subscribers , active , in_active , price_per_request
router.put(
  "/:competitionId",
  updateCompetitionValidation,
  updateCompetitionController
);

export default router;

/*-------------------optional-------------------*/
// optional route to delete competition by id by super admin
// router.delete("/competitions/:competitionId", isAuthenticated, isAuthorized(["super_admin"]));
