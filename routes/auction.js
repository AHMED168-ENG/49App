import express from 'express'
import { isAuthenticated } from '../middleware/is-authenticated.js'
import { addAuction, addUserAuction, allUsersAuction, auctionToggleApproved, deleteAuction, endAuction, followUserAuction, getAllAuctions, getAllAuctionsApproved, getAuction } from '../controllers/auction.js'
import { addUserAuctionValidation, createAuctionValidation } from '../validation/auction.js'
import handel_validation_errors from '../middleware/handelBodyError.js'


const router = express.Router()


/** ------------------------------------------------------  
 * @desc add user auction
 * @route /auction
 * @method post
 * @access private add user auction
 /**  ------------------------------------------------------  */
 router.post(
    "/add-auction-request/:id" , 
    isAuthenticated,    
    addUserAuctionValidation(),
    handel_validation_errors, 
    addUserAuction)


/** ------------------------------------------------------  
 * @desc add auction
 * @route /auction
 * @method post
 * @access private add auction
 /**  ------------------------------------------------------  */
router.post("/:id" , 
    isAuthenticated, 
    createAuctionValidation(),
    handel_validation_errors,
    addAuction
)

/** ------------------------------------------------------  
 * @desc get all Installments
 * @route /Installments
 * @method get
 * @access private get all Installments
 /**  ------------------------------------------------------  */
 router.get("/approved" , isAuthenticated , getAllAuctionsApproved)

/** ------------------------------------------------------  
 * @desc follow user auction
 * @route /auction
 * @method post
 * @access private follow user auction
 /**  ------------------------------------------------------  */
router.post("/follow-user-auction/:id" , 
    isAuthenticated , 
    followUserAuction)

/** ------------------------------------------------------  
 * @desc approve auction
 * @route /auction
 * @method post
 * @access private approve auction
 /**  ------------------------------------------------------  */
router.put("/toggle-auction/:id" , 
    isAuthenticated , 
    auctionToggleApproved)

/** ------------------------------------------------------  
 * @desc delete auction
 * @route /auction     
 * @method delete      
 * @access private delete auction
 /**  ------------------------------------------------------  */
router.delete("/:id" , isAuthenticated , deleteAuction)

/** ------------------------------------------------------  
 * @desc end auction
 * @route /auction
 * @method post
 * @access private end auction
 /**  ------------------------------------------------------  */
router.put("/end-auction/:id" , isAuthenticated , endAuction)

/** ------------------------------------------------------  
 * @desc get all auction
 * @route /auction
 * @method get
 * @access private get all auction
 /**  ------------------------------------------------------  */
router.get("/" , isAuthenticated , getAllAuctions)

/** ------------------------------------------------------  
 * @desc get auction
 * @route /auction
 * @method get
 * @access private get auction
 /**  ------------------------------------------------------  */
router.get("/:id" , isAuthenticated , getAuction)


/** ------------------------------------------------------  
 * @desc all user auction
 * @route /auction
 * @method post
 * @access private all user auction
 /**  ------------------------------------------------------  */
router.get(
    "/all-auction-request/:id" , 
    isAuthenticated ,     
    allUsersAuction
)



export default router