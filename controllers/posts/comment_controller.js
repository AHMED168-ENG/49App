import user_model from "../../models/user_model.js";
import post_model from "../../models/post_model.js";
import post_comment_model from "../../models/post_comment_model.js";
import notification_model from "../../models/notification_model.js";
import comment_replay_model from "../../models/comment_replay_model.js";
import auth_model from "../../models/auth_model.js";
import mongoose from "mongoose";
import asyncWrapper from "../../utils/asyncWrapper.js";
import * as social from "../social_helper.js"
import { baseUserKeys } from "../../helper.js";

export const commentOnPost=asyncWrapper(async(req,res,next)=>{
    const { language } = req.headers
    const {  postId, user_id, text, picture } = req.body
    //user_id=post_userid  note**
    if (!postId || !user_id || (!text && !picture)) return next('Bad Request')

    //constants
       const postownerStatus= await getPostOwnerStatus(req)
        const userstatus=await getuserStatus(req)
        const user=await  user_model.findById(req.user.id).select('first_name last_name profile_picture cover_picture')
        const peer=await  user_model.findById(user_id).select('first_name last_name profile_picture cover_picture')
        const post =await post_model.findOne({ _id: postId, user_id }).select('_id')
         const isBlocked = postownerStatus[0].is_blocked || userstatus[0].is_blocked
     
    if (!post || isBlocked) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })


    const object = new post_comment_model({
        user_id: req.user.id,
        picture,
        text,
        post_id: postId,
        post_owner_id: user_id,
    })

    const result = await object.save()
        //send notification
        const body=social.notification_body.newComment(user)
        social.sendNotification(user,peer,post,body)

    result._doc.user = user
    result._doc.total_likes = 0
    result._doc.total_wow = 0
    result._doc.total_angry = 0
    result._doc.total_sad = 0
    result._doc.total_love = 0

    delete result._doc.likes
    delete result._doc.love
    delete result._doc.wow
    delete result._doc.sad
    delete result._doc.angry

    res.json({
        'status': true,
        'data': result,
    })
})
async function getuserStatus(req){
 return await   user_model.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(req.body.user_id) } }, {
        $project: {
            is_blocked: { $in: [req.user.id, '$block'] },
        }
    }])
}
async function getPostOwnerStatus(req){
   return await user_model.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.user.id) } }, {
            $project: {
                is_blocked: { $in: [req.body.user_id, '$block'] },
                language: '$language'
            }
        }])
}

export const getPostComments=asyncWrapper(async(req,res,next)=>{
    const { page } = req.query

    const blockedUserIds = await user_model.findById(req.user.id).distinct('block')

    const comments = await post_comment_model.find({ post_id: req.params.postId, user_id: { $nin: blockedUserIds } }).sort({ createdAt: 1, _id: 1 })
        .skip((((page ?? 1) - 1) * 20))
        .limit(20).select('text user_id post_id picture createdAt')
     
    if (comments.length == 0) return res.status(200).send([])

    const userIds = []

    comments.forEach(e => {

        if (!userIds.includes(e.user_id)) userIds.push(e.user_id)
    })

    const commentsData = await Promise.all([
        user_model.find({ _id: { $in: userIds } }).select(baseUserKeys),
        post_comment_model.aggregate([
            { $match: { _id: { $in: comments.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                $project: {
                    total_likes: { $size: '$likes' },
                    total_wow: { $size: '$wow' },
                    total_angry: { $size: '$angry' },
                    total_sad: { $size: '$sad' },
                    total_love: { $size: '$love' },
                    is_like: { $in: [req.user.id, '$likes'] },
                    is_wow: { $in: [req.user.id, '$wow'] },
                    is_angry: { $in: [req.user.id, '$angry'] },
                    is_sad: { $in: [req.user.id, '$sad'] },
                    is_love: { $in: [req.user.id, '$love'] },
                }
            }]),


        user_model.aggregate([
            { $match: { _id: { $in: userIds.map(e => mongoose.Types.ObjectId(e)) } } }, {
                $project: {
                    is_blocked: { $in: [req.user.id, '$block'] },
                }
            }]),
        comment_replay_model.aggregate([
            {
                $match: {
                    'comment_id': { $in: comments.map(e => e.id) },
                }
            },
            { $group: { _id: '$comment_id', total: { $sum: 1 } }, },
        ])
    ])

    const users = commentsData[0]
    const allReactions = commentsData[1]
    const replies = commentsData[3]

    for (const comment of comments) {

        comment._doc.total_replies = 0
        for (const replay of replies) {
            if (replay._id == comment.id) {
                comment._doc.total_replies = replay.total
                break
            }
        }
        for (const user of users) {
            if (user.id == comment.user_id) {
                comment._doc.user = user
                break
            }
        }
        for (const reactions of allReactions) {
            if (reactions._id == comment.id) {
                comment._doc.total_likes = reactions.total_likes
                comment._doc.total_wow = reactions.total_wow
                comment._doc.total_angry = reactions.total_angry
                comment._doc.total_sad = reactions.total_sad
                comment._doc.total_love = reactions.total_love
                comment._doc.reaction = reactions.is_like ? 1 : reactions.is_love ? 2 : reactions.is_wow ? 3 : reactions.is_sad ? 4 : reactions.is_angry ? 5 : null

                break
            }
        }
    }
    res.json({
        'status': true,
        'data': comments,
    })
})

export const replyOnComment=asyncWrapper(async(req,res,next)=>{
    const { language } = req.headers

    const { post_id, comment_id, user_id, text, picture } = req.body

    if (!post_id || !comment_id || !user_id || (!text && !picture)) return next('Bad Request')


    const user =  await user_model.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.user.id) } }, {
            $project: {
                is_blocked: { $in: [user_id, '$block'] },
                language: '$language',
                first_name:"$first_name",
                last_name:"$last_name"
            }
        }]).then(x=>x[0])

    const peer =  await user_model.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(user_id) } }, {
            $project: {
                is_blocked: { $in: [req.user.id, '$block'] },
                language:"$language"
            }
        }]).then(x=>x[0])
        const post=await post_model.findById(post_id)
      console.log(user)
    if (!user) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })


    const isBlocked = user.is_blocked || post.is_blocked

    if (!post || isBlocked) return next({ 'status': 404, 'message': language == 'ar' ? 'التعليق غير موجود' : 'Comment Is not Exist' })


    const object = new comment_replay_model({
        user_id: req.user.id,
        picture,
        text,
        comment_id,
    })

    const result = await object.save()

      const body=social.notification_body.newCommentReply(user)
      social.sendNotification(user,peer,post,body)

    result._doc.user = user
    result._doc.total_likes = 0
    result._doc.total_wow = 0
    result._doc.total_angry = 0
    result._doc.total_sad = 0
    result._doc.total_love = 0

    delete result._doc.likes
    delete result._doc.love
    delete result._doc.wow
    delete result._doc.sad
    delete result._doc.angry

    res.json({
        'status': true,
        'data': result,
    })
})


export const getCommentReplies=asyncWrapper(async(req,res,next)=>{
    const { page } = req.query


    const blockedUserIds = await user_model.findById(req.user.id).distinct('block')

    const result = await comment_replay_model.find({ comment_id: req.params.commentId, user_id: { $nin: blockedUserIds } }).sort({ createdAt: 1, _id: 1 })
        .skip((((page ?? 1) - 1) * 20))
        .limit(20).select('text user_id picture video comment_id picture createdAt')

    if (result.length == 0) return res.json({
        'status': true,
        'data': [],
    })

    const userIds = []

    result.forEach(e => {

        if (!userIds.includes(e.user_id)) userIds.push(e.user_id)
    })

    const commentsData = await Promise.all([
        user_model.find({ _id: { $in: userIds } }).select(baseUserKeys),
        comment_replay_model.aggregate([
            { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
                $project: {
                    total_likes: { $size: '$likes' },
                    total_wow: { $size: '$wow' },
                    total_angry: { $size: '$angry' },
                    total_sad: { $size: '$sad' },
                    total_love: { $size: '$love' },
                    is_like: { $in: [req.user.id, '$likes'] },
                    is_wow: { $in: [req.user.id, '$wow'] },
                    is_angry: { $in: [req.user.id, '$angry'] },
                    is_sad: { $in: [req.user.id, '$sad'] },
                    is_love: { $in: [req.user.id, '$love'] },
                }
            }]),
        user_model.aggregate([
            { $match: { _id: { $in: userIds.map(e => mongoose.Types.ObjectId(e)) } } }, {
                $project: {
                    is_blocked: { $in: [req.user.id, '$block'] },
                }
            }]),

    ])

    const users = commentsData[0]
    const allReactions = commentsData[1]

    for (const comment of result) {

        for (const user of users) {
            if (user.id == comment.user_id) {
                comment._doc.user = user
                break
            }
        }
        for (const reactions of allReactions) {
            if (reactions._id == comment.id) {
                comment._doc.total_likes = reactions.total_likes
                comment._doc.total_wow = reactions.total_wow
                comment._doc.total_angry = reactions.total_angry
                comment._doc.total_sad = reactions.total_sad
                comment._doc.total_love = reactions.total_love
                comment._doc.reaction = reactions.is_like ? 1 : reactions.is_love ? 2 : reactions.is_wow ? 3 : reactions.is_sad ? 4 : reactions.is_angry ? 5 : null

                break
            }
        }
    }
    res.json({
        'status': true,
        'data': result,
    })
})