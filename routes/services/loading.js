import express from 'express'
import { verifyToken } from '../../helper.js'
import {createCarForLoading,deleteCarForLoading} from '../../controllers/loading/loading_registration.js';
import handel_validation_errors from '../../middleware/handelBodyError.js';
import {validationRegisterLoading , requestLoadingValidation ,validationLoadingRating , validateLoadingOffer , acceptLoadingOfferValidation} from '../../validation/loading_validation.js';
import { addRating, deleteRating } from '../../controllers/loading/loading_rating.js';
import { acceptLoadingOffer, deleteLoadingRequest, getAllUserLoading, getLoadingTrip, makeRequestForLoading , sendLoadingOffer } from '../../controllers/loading/loading_offer.js';
const router = express.Router()

router.use(verifyToken)

/** ------------------------------------------------------  
 * @desc register with car for loading
 * @route /register
 * @method post
 /**  ------------------------------------------------------  */
router.post('/register', validationRegisterLoading(), handel_validation_errors, createCarForLoading)

/** ------------------------------------------------------  
 * @desc delete register with car for loading
 * @route /delete-registration
 * @method delete
 /**  ------------------------------------------------------  */
router.delete('/delete-registration',deleteCarForLoading)

/** ------------------------------------------------------  
 * @desc add rating for specific loading
 * @route /rating
 * @method post
 /**  ------------------------------------------------------  */
router.post('/rating',validationLoadingRating(),handel_validation_errors, addRating)

/** ------------------------------------------------------  
 * @desc delete rating for specific loading
 * @route /delete-rating
 * @method delete
 /**  ------------------------------------------------------  */
router.delete('/delete-rating', deleteRating )

/** ------------------------------------------------------  
 * @desc rider get loading tripe by id
 * @route /get-loading-trips
 * @method get
 /**  ------------------------------------------------------  */
router.get('/get-loading-trips', getLoadingTrip)

/** ------------------------------------------------------  
 * @desc make request for loading
 * @route /new-loading-request
 * @method post
 /**  ------------------------------------------------------  */
router.post('/new-loading-request',requestLoadingValidation() , handel_validation_errors , makeRequestForLoading)

/** ------------------------------------------------------  
 * @desc send loading offer
 * @route /send-loading-offer
 * @method post
 /**  ------------------------------------------------------  */
router.post('/send-loading-offer',validateLoadingOffer() , handel_validation_errors ,sendLoadingOffer)

/** ------------------------------------------------------  
 * @desc accept loading offer
 * @route /accept-loading-offer
 * @method post
 /**  ------------------------------------------------------  */
router.post('/accept-loading-offer', acceptLoadingOfferValidation() , handel_validation_errors , acceptLoadingOffer)

/** ------------------------------------------------------  
 * @desc delete loading request for specific request
 * @route /delete-loading-request
 * @method delete
 /**  ------------------------------------------------------  */
router.delete('/delete-loading-request/:requestId', deleteLoadingRequest)

/** ------------------------------------------------------  
 * @desc get all user loadings
 * @route /get-user-loadings
 * @method get
 /**  ------------------------------------------------------  */
router.get('/get-user-loadings', getAllUserLoading)

export default router