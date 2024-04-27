import express from 'express'
import { tryVerify } from '../../helper.js'
import cancelation_reasons from '../../models/cancelation_reasons.js'
import handel_validation_errors from '../../middleware/handelBodyError.js';
import { cancelReasonCreateValidation , cancelReasonUpdateValidation } from '../../validation/cancelation_reason.js';

const router = express.Router()

router.get('/', tryVerify, async (req, res, next) => {

    try {
        const {page = 0 , limit = 0} = req.query
        const cancels = await cancelation_reasons.paginate({limit , page})
        res.json({
            data : cancels ,             
            status : true,
    })
    } catch (e) {
        next(e)
    }
})

router.get('/:id', tryVerify, async (req, res, next) => {

    try {
        const {id} = req.params
        const cancelReason = await cancelation_reasons.findOne({_id : id})
        res.json({
            data : cancelReason ,             
            status : true,
        })
    } catch (e) {
        next(e)
    }
})


router.post('/', tryVerify , cancelReasonCreateValidation() , handel_validation_errors , async (req, res, next) => {

    try {
        const body = req.body
        const cancels = await cancelation_reasons.create(body)
        res.json({
            data : cancels ,             
            status : true,
    })
    } catch (e) {
        next(e)
    }
})


router.put('/:id', tryVerify, cancelReasonUpdateValidation() , handel_validation_errors , async (req, res, next) => {

    try {
        const {id} = req.params
        const body = req.body
        const cancelReason = await cancelation_reasons.findOneAndUpdate({_id : id } , body , {new : true})
        res.json({
            data : cancelReason ,             
            status : true,
    })
    } catch (e) {
        next(e)
    }
})


router.delete('/:id', tryVerify, async (req, res, next) => {

    try {
        const {id} = req.params
        const cancelReason = await cancelation_reasons.findOneAndDelete({_id : id })
        res.json({
            data : cancelReason ,             
            status : true,
    })
    } catch (e) {
        next(e)
    }
})


export default router