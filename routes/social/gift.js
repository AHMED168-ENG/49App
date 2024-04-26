import express from 'express'
import { getPaymobToken, makeOrder, makeWalletOrder, paymentKeys } from '../../controllers/paymob_controller.js'
import { verifyToken } from '../../helper.js'
import * as gift_controller from "../../controllers/gift/gift_controller.js"
import gift_model from '../../models/gift_model.js'
import user_model from '../../models/user_model.js'

const router = express.Router()

router.get('/get',gift_controller.getGifts)

router.post('/pay', verifyToken, gift_controller.pay)

export default router