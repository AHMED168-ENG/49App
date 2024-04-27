import { approveResetImage, getAllResetImage, getPaymentNotification, payWithNumber, saveResetImage } from "../controllers/manual_payment.js"
import { verifyToken } from "../helper.js"
import handel_validation_errors from "../middleware/handelBodyError.js"
import { approvedReset, payWithNumberValidation, saveResetImageValidation } from "../validation/manual_payment.js"
import express from 'express'

const router = express.Router()


/** ------------------------------------------------------  
 * @desc insta pay manual pay with number
 * @route  insta pay manual pay with number
 * @method post
 * @access private insta pay manual pay with number
/**  ------------------------------------------------------  */
router.post('/pay-with-number', verifyToken , payWithNumberValidation() , handel_validation_errors , payWithNumber)

/** ------------------------------------------------------  
 * @desc get payment instapay notificatioon
 * @route  get payment instapay notificatioon
 * @method get
 * @access private get pay ment notificatioon 
/**  ------------------------------------------------------  */
router.get('/get-payment-notification', verifyToken , getPaymentNotification)


/** ------------------------------------------------------  
 * @desc save reset in database
 * @route  save reset in database
 * @method post
 * @access private save reset in database
/**  ------------------------------------------------------  */
router.post('/save-reset-image' , verifyToken , saveResetImageValidation() , handel_validation_errors , saveResetImage)

/** ------------------------------------------------------  
 * @desc get all reset
 * @route  get all reset
 * @method post
 * @access private get all reset
/** ------------------------------------------------------  */
router.get('/get-all-resets' , verifyToken , getAllResetImage)


/** ------------------------------------------------------  
 * @desc change approve image
 * @route  change approve
 * @method put
 * @access private change approve image
/**  ------------------------------------------------------  */
router.put('/change-approve/:id' , verifyToken , approveResetImage)


export default router