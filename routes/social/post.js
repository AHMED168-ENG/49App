import express from 'express'
import post_model from '../../models/post_model.js'
import post_feeling_model from '../../models/post_feeling_model.js'
import post_activity_model from '../../models/post_activity_model.js'
import user_model from '../../models/user_model.js'
import mongoose from 'mongoose'

import { downloadFiles, uploadFilesRelease } from '../../controllers/s3_controller.js'

import { baseUserKeys, tryVerify, verifyToken } from '../../helper.js'
import post_comment_model from '../../models/post_comment_model.js'
import auth_model from '../../models/auth_model.js'
import notification_model from '../../models/notification_model.js'
import { sendNotifications } from '../../controllers/notification_controller.js'
import comment_replay_model from '../../models/comment_replay_model.js'
import * as post_controller  from "../../controllers/posts/post_controller.js"
import * as edit_controller  from "../../controllers/posts/edit_controller.js"
import * as get_controller from "../../controllers/posts/get_controller.js"
import * as delete_controller from "../../controllers/posts/delete_controller.js"
import * as react_controller from "../../controllers/posts/react_controller.js"
import * as comment_controller from "../../controllers/posts/comment_controller.js"
import * as post from '../../validation/post.js'
import { isAuthenticated } from '../../middleware/is-authenticated.js'
const router = express.Router()


router.get('/feelings',post_controller.feelings)

router.get('/activities',post_controller.activites)
//test
router.post('/create', verifyToken,post.validationCreatePost(),post_controller.create)

router.get('/get-my-posts', verifyToken,post.PostExists(),post_controller.getMyPosts)


router.get('/get-total-reactions/:postId', tryVerify,get_controller.getTotalReactions)
//return null
router.get('/get-post-reactions/:postId', verifyToken,post.PostExists(), get_controller.getPostReactions)
router.get('/get-single/:postId',verifyToken,post.PostExists(),post.validationGetSingle(),get_controller.getSingle)


router.delete('/delete-my-post/:postId', verifyToken,post.PostExists(),delete_controller.deleteMyPost)
router.delete('/remove-post-tag/:postId', verifyToken,post.PostExists(),delete_controller.removePostTag)
router.delete('/delete-replay', verifyToken,delete_controller.removePostTag)
router.post('/hide-post', verifyToken,post.PostExists(),delete_controller.hidePost)

router.post('/react-on-post', verifyToken,post.PostExists(),react_controller.reactOnPost)
router.post('/share-post', verifyToken,post.PostExists(),post_controller.sharepost)
   

router.get('/get-peer-posts/:peerId',isAuthenticated,get_controller.getPeerPosts)
router.get('/get-global-posts', verifyToken,get_controller.getGlobalPosts)


router.post('/react-on-replay', verifyToken,react_controller.reactOnReply)
//edit
router.put('/edit-my-post', verifyToken, post.PostExists(),edit_controller.editmyPost)
router.put('/edit-my-comment', verifyToken,edit_controller.editmyComment)
router.put('/edit-my-post-privacy', verifyToken,post.PostExists(),edit_controller.editmyPostPrivacy)
router.put('/edit-comments-post-privacy', verifyToken,post.PostExists(),edit_controller.editcommentsPostPrivacy)
//comments
router.get('/get-post-comments/:postId', verifyToken,post.PostExists(),comment_controller.getPostComments)
router.get('/get-comment-replies/:commentId', verifyToken,comment_controller.getCommentReplies)
router.post('/react-on-comment', verifyToken,post.PostExists(),react_controller.reactOnComment)
router.post('/comment-on-post', verifyToken,post.PostExists(),comment_controller.commentOnPost)
router.post('/replay-on-comment', verifyToken,comment_controller.replyOnComment)
router.delete('/delete-comment', verifyToken,post.PostExists(),delete_controller.deleteComment)


export default router