
import express from 'express'
import handel_validation_errors from '../middleware/handelBodyError.js';
import { createAddress, getAddress , getAllAddress , updateAddress , deleteAddress} from '../controllers/address.js';
import { createAddressValidation, updateAddressValidation } from '../validation/address.js';
import { verifyToken } from '../helper.js';

const router = express.Router()
router.post('/' , verifyToken , createAddressValidation() , handel_validation_errors , createAddress)
router.get('/:id' , verifyToken  , getAddress)
router.get('/' , verifyToken , getAllAddress)
router.put('/:id' , verifyToken , updateAddressValidation() , handel_validation_errors , updateAddress)
router.delete('/:id' , verifyToken , deleteAddress)

export default router