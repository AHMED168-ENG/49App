import express from "express";
import { isAuthorized } from "../../middleware/is-authorized";

const router = express.Router();

// all current user's data -> need discussion
router.get("/profile");

// block user from current user -> need discussion
router.put("/profile/:profileId/block");

// get user profile -> need discussion
router.get("/profile/profiles/:profileId");

// get follower id -> need discussion
router.get("/profiles/followers/:followerId");

// return friend by id -> need discussion
router.get("/profile/:userId");

/*****************  Done  *****************/
/**
 * @Abdullah
 */
// super admin get all profiles 
router.get("/dashbaord/profiles", isAuthorized(["super_admin"]));

router.get("/dashbaord/profiles/:profileId", isAuthorized(["super_admin"]));

router.put("/dashbaord/profiles/:profileId", isAuthorized(["super_admin"]));

router.put("/dashbaord/profiles", isAuthorized(["super_admin"]));





/**
 * @SeifEldinKen
 */
// return all current user's friends
router.get("/profile/friends");
// delete friend from current user
router.delete("/profile/friends/:friendId");

// get all requests
router.get("/profiles/requests");

// done send request friend
router.post("/profiles/requests/:userId");

// done accept friend request from current user
router.put("/profiles/requests/:requestId/accept");

// done decline friend request from current user
router.delete("/profiles/requests/:requestId/reject");


/**
 * @mshehab841
 */
// get all blocked users from current user
router.get("/profiles/blocks");

// get all followe from current user
router.get("/profiles/followers");

// delete follower
router.delete("/profiles/followers/:followerId");

// get all followings from current user
router.get("/profiles/followings");

// serach for user by name -> need discussion
router.get("/profiles?search=name");
export default router;
