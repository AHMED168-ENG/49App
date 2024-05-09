import express from 'express'
import { isAuthenticated } from '../middleware/is-authenticated.js'
import { addAgendaInstallments, addInstallments, addUserInstallments, addUsersAssets, allUsersInstallments, approveUserInstallments, deleteInstallments, followUserInstallments, getAllInstallments, getAllInstallmentsApproved, getInstallments, installmentsToggleApproved} from '../controllers/installments.js'
import { addUserInstallmentsAssetsValidation, addUserInstallmentsValidation, createInstallmentsValidation } from '../validation/installments.js'
import handel_validation_errors from '../middleware/handelBodyError.js'


const router = express.Router()


/** ------------------------------------------------------  
 * @desc add Installments
 * @route /Installments
 * @method post
 * @access private add Installments
 /**  ------------------------------------------------------  */
router.post("/:id" , 
    isAuthenticated, 
    createInstallmentsValidation(),
    handel_validation_errors,
    addInstallments
)

/** ------------------------------------------------------    
 * @desc follow user Installments
 * @route /Installments
 * @method post
 * @access private follow user Installments
 /**  ------------------------------------------------------  */
router.put("/follow-user-installments/:id" , 
    isAuthenticated , 
    followUserInstallments)

/** ------------------------------------------------------  
 * @desc approve Installments
 * @route /Installments
 * @method post
 * @access private approve Installments
 /**  ------------------------------------------------------  */
router.put("/toggle-installments/:id" , 
    isAuthenticated , 
    installmentsToggleApproved)

/** ------------------------------------------------------     
 * @desc delete Installments
 * @route /Installments     
 * @method delete      
 * @access private delete Installments
 /**  ------------------------------------------------------  */
router.delete("/:id" , isAuthenticated , deleteInstallments)

/** ------------------------------------------------------  
 * @desc get all Installments
 * @route /Installments
 * @method get
 * @access private get all Installments
 /**  ------------------------------------------------------  */
router.get("/" , isAuthenticated , getAllInstallments)

/** ------------------------------------------------------  
 * @desc get all Installments
 * @route /Installments
 * @method get
 * @access private get all Installments
 /**  ------------------------------------------------------  */
router.get("/approved" , isAuthenticated , getAllInstallmentsApproved)

/** ------------------------------------------------------  
 * @desc get Installments
 * @route /Installments
 * @method get
 * @access private get Installments
 /**  ------------------------------------------------------  */
router.get("/:id" , isAuthenticated , getInstallments)


/** ------------------------------------------------------  
 * @desc add user Installments request
 * @route /Installments
 * @method post
 * @access private add user Installments request
 /**  ------------------------------------------------------  */
router.post(
    "/add-installments-request/:id" , 
    isAuthenticated ,     
    addUserInstallmentsValidation(),
    handel_validation_errors,
    addUserInstallments
)

/** ------------------------------------------------------  
 * @desc approve user Installments request
 * @route /approve Installments request
 * @method post
 * @access private approve user Installments request
 /**  ------------------------------------------------------  */
router.post(
    "/approve-installments-request/:id" , 
    isAuthenticated ,     
    approveUserInstallments
)
/** ------------------------------------------------------  
 * @desc all user Installments          
 * @route /Installments
 * @method post
 * @access private all user Installments
 /**  ------------------------------------------------------  */
router.get(
    "/all-installments-request/:id" , 
    isAuthenticated ,     
    allUsersInstallments
)
/** ------------------------------------------------------  
 * @desc add schedule user          
 * @route /Installments
 * @method post
 * @access private add schedule user
 /**  ------------------------------------------------------  */
router.get(
    "/add-installments-schedule/:id" , 
    isAuthenticated ,     
    addAgendaInstallments
)


/** ------------------------------------------------------  
 * @desc add user Installments assets
 * @route /Installments
 * @method post
 * @access private add user Installments assets
 /**  ------------------------------------------------------  */
router.post(
    "/add-installments-assets/:id" , 
    isAuthenticated ,     
    addUserInstallmentsAssetsValidation(),
    handel_validation_errors,
    addUsersAssets
)



export default router