import express from "express";
import {createWinnerController , getWinnerController , getWinnersController} from "../../controllers/dashboard/wheel_winner.js";
import { isAuthenticated } from "../../middleware/is-authenticated.js";
import { isAuthorized } from "../../middleware/is-authorized.js";

const router = express.Router()

router.post("/:userId", isAuthenticated, isAuthorized(["super_admin"]),createWinnerController)
router.get("/:winnerId", isAuthenticated, isAuthorized(["super_admin"]),getWinnerController)
router.get("/", isAuthenticated, isAuthorized(["super_admin"]),getWinnersController)


export default router