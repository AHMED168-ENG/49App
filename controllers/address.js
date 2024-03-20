import app_manager_model from '../models/app_manager_model.js'
import address_model from '../models/address.js'
import httpStatus from 'http-status'



// create address
export const createAddress = async (req , res , next) => {
    try {
        const {id} = req.user
        const body = req.body
        const address = await address_model.create({...body , user_id : id})
        res.status(httpStatus.CREATED).json(address)
    } catch (error) {
        next(error)
    }
}

// update address
export const updateAddress = async (req , res , next) => {
    try {
        const {id} = req.user
        const _id = req.params.id
        const body = req.body
        const address = await address_model.findOneAndUpdate({_id},{...body , user_id : id} , {new : true})
        res.status(httpStatus.OK).json(address)
    } catch (error) {
        next(error)
    }
}

// get all address
export const getAllAddress = async (req , res , next) => {
    try {
        
        const {id} = req.user
        const {page = process.env.page , limit = process.env.limit} = req.query
        const address = await address_model.paginate({ user_id : id} , {
            page , 
            limit ,      
            sort : {
                createdAt : -1
            },
            populate : ["user_id"]
        })
        res.status(httpStatus.OK).json(address)
    } catch (error) {
        next(error)
    }
}

// get one address
export const getAddress = async (req , res , next) => {
    try {
        const {id} = req.params
        const userId = req.user.id
        const address = await address_model.findOne({_id : id , user_id : userId}).populate("user_id")
        res.status(httpStatus.OK).json(address)
    } catch (error) {
        next(error)
    }
}


// delete address
export const deleteAddress = async (req , res , next) => {
    try {
        const {id} = req.params
        const userId = req.user.id
        const address = await address_model.deleteOne({_id : id , user_id : userId}).populate("user_id")
        res.status(httpStatus.OK).json(address)
    } catch (error) {
        next(error)
    }
}