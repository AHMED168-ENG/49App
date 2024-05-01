import express from 'express'
import {createCarForLoading,deleteCarForLoading} from '../../controllers/loading/loading_registration.js';
import {validationRegisterLoading , requestLoadingValidation ,validationAddRating , validateLoadingOffer , acceptLoadingOfferValidation} from '../../validation/loading_validation.js';
import { addRating, deleteRating } from '../../controllers/loading/loading_rating.js';
import { acceptLoadingOffer, deleteLoadingRequest, getAllUserLoading, getLoadingTrip, makeRequestForLoading , sendLoadingOffer } from '../../controllers/loading/loading_offer.js';
import { isAuthenticated } from '../../middleware/is-authenticated.js';
import { isAuthorized } from '../../middleware/is-authorized.js';
const router = express.Router()

router.use(isAuthenticated)
router.use(isAuthorized(["user", "admin", "super_admin"]));


router.post('/register', validationRegisterLoading(), createCarForLoading)

router.delete('/delete-registration',deleteCarForLoading)

router.post('/rating',validationAddRating(), addRating)

router.delete('/delete-rating', deleteRating )

router.get('/get-loading-trips', getLoadingTrip)

router.post('/new-loading-request',requestLoadingValidation() , makeRequestForLoading)

router.post('/send-loading-offer',validateLoadingOffer() ,sendLoadingOffer)

router.post('/accept-loading-offer', acceptLoadingOfferValidation(),acceptLoadingOffer)

router.delete('/delete-loading-request/:requestId', deleteLoadingRequest)

router.get('/get-user-loadings', getAllUserLoading)

export default router