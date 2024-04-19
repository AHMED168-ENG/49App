import httpStatus from "http-status"
import contact_model from '../models/contact_model.js'
import { errorWithLanguages } from "../utils/errorWithLanguages.js"

export const contactsIsEmpty=async(req,res,next)=>{
    const { archived } = req.query
    const contacts = await contact_model.find({
        owner_id: req.user.id,
        type: 1,
        is_archived: archived == 'true',
    }).sort({ createdAt: -1, _id: 1 })
   
   
    if (contacts.length == 0) return res.status(200).send(errorWithLanguages({en : "you dont have contacts yet",ar:"ليس عندك جهات الاتصال حتى الان"}));

    //validated
    req.contacts=contacts
    next()
}