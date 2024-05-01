import express from 'express'
import { baseUserKeys, verifyToken } from '../../helper.js'
import * as chatcontroller from "../../controllers/chat/chat_controller.js"
import * as message_controller from "../../controllers/chat/message_controller.js"
import * as group_controller from "../../controllers/chat/group_controller.js"
import {isAuthenticated} from "../../middleware/is-authenticated.js"
import { contactsIsEmpty } from '../../validation/chat.js'

const router = express.Router()


router.get('/get-contacts', verifyToken,contactsIsEmpty,chatcontroller.getContacts)
router.get('/get-call-logs', verifyToken,chatcontroller.getCallLogs)
router.get('/get-message-total-reactions/:id', verifyToken,message_controller.getMessageTotalReactions)
router.put("/delete-chat-24hours",chatcontroller.deleteChat24Hours)
router.put("/lock-chat",isAuthenticated,chatcontroller.lockChat)
router.put("/unlock-chat",isAuthenticated,chatcontroller.unlockChat)
router.get('/get-message-reactions/:id', verifyToken,message_controller.getMessageReactions)
router.get("/get-chat-seen-logs/:userid",verifyToken,chatcontroller.getChatSeenLogs)
router.get("/get-chat",verifyToken,chatcontroller.getChat)
/////
router.get('/get-groups', verifyToken,group_controller.getGroups)

router.get('/get-group-members/:id', verifyToken,group_controller.getGroupMembers)

router.get('/get-group-members-names/:id',verifyToken,group_controller.getGroupdMembersNames)

export default router