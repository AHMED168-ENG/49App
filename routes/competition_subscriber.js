import express from "express";
import { signInCompetition ,ownCompetitions  ,getCompetitionById ,deleteSubscriptionByUser} from "../controllers/competition_subscriber.js";
import { isAuthenticated } from "../middleware/is-authenticated.js";
import { isAuthorized } from "../middleware/is-authorized.js";
import { getWinners } from "../controllers/dashboard/winner.js";
const router = express.Router();

// subscribe to competition by user only to active competitions
router.post("/competition/:competitionsId",isAuthenticated,isAuthorized(["user"]),signInCompetition);

// get all competitions that user subscribed to(only active competitions)

router.get("/competitions", isAuthenticated, isAuthorized(["user"]) ,ownCompetitions);

// get all winners for whole competitions
router.get("/winners", isAuthenticated, isAuthorized(["user"]) , getWinners );

// get competition by id that user subscribed to(only active competitions)

router.get("/competition/:id", getCompetitionById);

// delete subscription by user to competition by id by user also delete user wallet for this competition
router.delete("/competition/:competitionId",isAuthenticated,isAuthorized(["user"]) , deleteSubscriptionByUser);

export default router;