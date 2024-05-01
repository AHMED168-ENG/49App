import {createWinner ,getWinners ,getWinnerById} from "../../controllers/dashboard/winner.js";
import {isAuthenticated} from "../../middleware/is-authenticated.js";
import {isAuthorized} from "../../middleware/is-authorized.js";
import express from "express";
const router = express.Router();

// make user winner route by super admin -> just only active competitions
// check of subscriber's counter is equal to limitOf competition

router.put("/:subscriberId",isAuthenticated,isAuthorized(["super_admin"]),createWinner);

// get all winners for whole competitions by super admin
/*
    1- all winners (include name, email, phone, wallet, status , counter , isBlocked/fraud)
 */

// make super admin query what is need all winners in all competitions or in specific competition
router.get("/",isAuthenticated,isAuthorized(["super_admin"]) , getWinners);

// get specific winner by id by super admin
router.get("/:winnerId",isAuthenticated,isAuthorized(["super_admin"]) , getWinnerById);

export default router