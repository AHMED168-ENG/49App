import express from 'express'
import { getPaymobToken, getHMACByOrderId, makeOrder, paymentKeys } from '../controllers/paymob_controller.js'
import { sendNotifications } from '../controllers/notification_controller.js'
import { serverURL, verifyToken } from '../helper.js'
import subscription_model from '../models/subscription_model.js'
import notification_model from '../models/notification_model.js'
import sub_category_model from '../models/sub_category_model.js'
import user_model from '../models/user_model.js'
import auth_model from '../models/auth_model.js'
import wallet_model from '../models/wallet_model.js'
import transactionModel from '../models/transaction.js'
import dynamic_ad_model from '../models/dynamic_ad_model.js'
import rider_model from '../models/rider_model.js'
import { calculateWithPaymob, calculateWithPaymobForAllOperations } from '../controllers/accounts_controller.js'
import { appRadioCategoryId, foodCategoryId, healthCategoryId, profileViewCategoryId } from '../controllers/ride_controller.js'
import restaurant_model from '../models/restaurant_model.js'
import doctor_model from '../models/doctor_model.js'
import gift_model from '../models/gift_model.js'
import { giftCashBack } from '../controllers/cash_back_controller.js'
import app_radio_model from '../models/app_radio_model.js'
import axios from 'axios'
import { chargeMony, sendMonyToUser } from '../validation/charging-wallet.js'
import handel_validation_errors from '../middleware/handelBodyError.js'
import app_manager_model from '../models/app_manager_model.js'
import { chargeWallet, getCallbackPayment, getUserBallance, getWalletDetails, paymentCallback, sendMonyPayment } from '../controllers/wallet.controller.js'



const router = express.Router()

/** ------------------------------------------------------  
 * @desc callback
 * @route /payment
 * @method post
 * @access private call back
 /**  ------------------------------------------------------  */
router.post('/callback', paymentCallback)

/** ------------------------------------------------------  
 * @desc callback
 * @route /payment
 * @method get
 * @access private callback
 /**  ------------------------------------------------------  */
router.get('/callback', getCallbackPayment)


/** ------------------------------------------------------  
 * @desc charge wallet
 * @route /payment
 * @method post
 * @access private charge wallet
 /**  ------------------------------------------------------  */
router.post('/charging-wallet' , verifyToken , chargeMony() , handel_validation_errors , verifyToken , chargeWallet)

/** ------------------------------------------------------  
 * @desc send mony to user
 * @route /payment 
 * @method post 
 * @access private send mony to user
 /**  ------------------------------------------------------  */
router.post('/send-mony-to-user/:user_id' , sendMonyToUser() , handel_validation_errors , verifyToken , sendMonyPayment)

/** ------------------------------------------------------  
 * @desc get user ballance
 * @route /payment
 * @method post
 * @access private get user ballance
 /**  ------------------------------------------------------  */
 router.post('/get-user-balance' , sendMonyToUser() , handel_validation_errors , verifyToken , getUserBallance)

 
/** ------------------------------------------------------  
 * @desc get wallet details
 * @route /payment
 * @method post
 * @access private get wallet details
 /**  ------------------------------------------------------  */
router.get('/get-wallet-details', verifyToken , getWalletDetails)

export default router