
import express from 'express'
import handel_validation_errors from '../middleware/handelBodyError.js';
import { createAddress, getAddress , getAllAddress , updateAddress , deleteAddress} from '../controllers/address.js';
import { verifyToken } from '../helper.js';
import { createAddressValidation, updateAddressValidation } from '../validation/address.js';

const router = express.Router()

router.post('/'  , createAddressValidation() , handel_validation_errors , createAddress)
router.get('/:id'   , getAddress)
router.get('/'  , getAllAddress)
router.put('/:id'  , updateAddressValidation() , handel_validation_errors , updateAddress)
router.delete('/:id'   , deleteAddress)


export default router