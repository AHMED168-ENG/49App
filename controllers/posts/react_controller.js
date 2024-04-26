import comment_replay_model from "../../models/comment_replay_model.js"
import post_comment_model from "../../models/post_comment_model.js"
import user_model from "../../models/user_model.js"
import post_model from "../../models/post_model.js"
import asyncWrapper from "../../utils/asyncWrapper.js"
import notification_model from "../../models/notification_model.js"
import auth_model from "../../models/auth_model.js"
import { sendNotifications } from "../notification_controller.js"
import * as social from "../social_helper.js"
import mongoose from "mongoose"
export const reactOnReply= asyncWrapper(async(req,res,next)=>{
    const { replay_id, reaction_id } = req.body
      if(!replay_id || !reaction_id) return next("fiels are required")

    await comment_replay_model.updateOne(
        { _id: replay_id },
        { $pull: { likes: req.user.id, love: req.user.id, wow: req.user.id, sad: req.user.id, angry: req.user.id } }
    )
        await comment_replay_model.updateOne(
            { _id: replay_id },
            {
                $addToSet: reaction_id == 1 ? { likes: req.user.id } : reaction_id == 2 ? { love: req.user.id } : reaction_id == 3 ? { wow: req.user.id } : reaction_id == 4 ? { sad: req.user.id } : { angry: req.user.id }
            },
        ).exec()

    const reactions = await comment_replay_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(replay_id) } }, {
        $project: {
            total_likes: { $size: '$likes' },
            total_wow: { $size: '$wow' },
            total_angry: { $size: '$angry' },
            total_sad: { $size: '$sad' },
            total_love: { $size: '$love' },
        },
    }]).limit(1)

    res.json({
        'status': true,
        'data': reactions[0],
    })
})
export const reactOnComment=asyncWrapper(async(req,res,next)=>{
    const { post_id, comment_id, reaction_id } = req.body
      if(!post_id || !comment_id || !reaction_id) return next("Fields are required")
    await post_comment_model.updateOne(
        { _id: comment_id, post_id },
        { $pull: { likes: req.user.id, love: req.user.id, wow: req.user.id, sad: req.user.id, angry: req.user.id } }
    )
    if (reaction_id != null)
        await post_comment_model.updateOne(
            { _id: comment_id, post_id },
            {
                $addToSet: reaction_id ==social.reaction.like ? { likes: req.user.id } : reaction_id == social.reaction.love ? { love: req.user.id } : reaction_id == social.reaction.wow ? { wow: req.user.id } : reaction_id == social.reaction.sad ? { sad: req.user.id } : { angry: req.user.id }
            },
        ).exec()

    const reactions = await post_comment_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(comment_id) } }, {
        $project: {
            total_likes: { $size: '$likes' },
            total_wow: { $size: '$wow' },
            total_angry: { $size: '$angry' },
            total_sad: { $size: '$sad' },
            total_love: { $size: '$love' },
        },
    }])
    res.json({
        'status': true,
        'data': reactions[0],
    })
})
export const reactOnPost=asyncWrapper(async(req,res,next)=>{
    const { language } = req.headers

        const { post_id, user_id, reaction_id } = req.body

        if (!post_id || !user_id) return next('Bad Request')
        
        const user =await   user_model.findOne({ _id: req.user.id, is_locked: false }).select('first_name last_name block')
        const peer = await  user_model.findOne({ _id: user_id, is_locked: false }).select('first_name last_name block language')
        const post = await  post_model.findOneAndUpdate({ _id: post_id },{ $pull: { likes: req.user.id, love: req.user.id, wow: req.user.id, sad: req.user.id, angry: req.user.id } }).select('_id')
       
        if (!user || !peer || !post || user.block.includes(user_id) || peer.block.includes(req.user.id)) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })

        ReactandNotificate(reaction_id,user,user_id,peer,post)

        const reactions = await post_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(post_id) } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
            },
        }])


        reactions[0].total_comments = await post_comment_model.find({ post_id }).count()
         
        res.json({
            'status': true,
            'data': reactions[0],
        })
})
async function ReactandNotificate(reaction_id,user,user_id,peer,post){
    //update post and add user id to the new reaction
    await post_model.updateOne(
        { _id: post.id },
        {
            $addToSet: reaction_id == social.reaction.like ? { likes: user.id } : reaction_id == social.reaction.love ? { love: user.id } : reaction_id == social.reaction.wow ? { wow: user.id } : reaction_id == social.reaction.sad ? { sad: user.id } : { angry: user.id }
        },
    ).exec()

    if ( (await notification_model.findOne({ receiver_id: user_id, user_id: user.id, type: 1, direction: post.id })) == null) {
        await social.sendNotification(user,peer,post,social.notification_body.likeOnPost(user))
    }
}

