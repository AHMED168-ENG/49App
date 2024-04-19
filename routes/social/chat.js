import express from 'express'
import { baseUserKeys, verifyToken } from '../../helper.js'
import user_model from '../../models/user_model.js'
import message_model from '../../models/message_model.js'
import contact_model from '../../models/contact_model.js'

import mongoose from 'mongoose'
import subscription_model from '../../models/subscription_model.js'
import call_log_model from '../../models/call_log_model.js.js'
import chat_group_model from '../../models/chat_group_model.js'
import * as chatcontroller from "../../controllers/chat/chat_controller.js"
import * as message_controller from "../../controllers/chat/message_controller.js"
import * as group_controller from "../../controllers/chat/group_controller.js"
import { isTaxiOrCaptainOrScooter } from '../../controllers/ride_controller.js'
import { contactsIsEmpty } from '../../validation/chat.js'

const router = express.Router()


router.get('/get-contacts', verifyToken,contactsIsEmpty,chatcontroller.getContacts)
router.get('/get-call-logs', verifyToken,chatcontroller.getCallLogs)
router.get('/get-message-total-reactions/:id', verifyToken,message_controller.getMessageTotalReactions)

router.get('/get-message-reactions/:id', verifyToken,message_controller.getMessageReactions)


/////

router.get('/get-groups', verifyToken,group_controller.getGroups)

router.get('/get-group-members/:id', verifyToken,group_controller.getGroupMembers)

router.get('/get-group-members-names/:id',verifyToken,group_controller.getGroupdMembersNames)

export default router