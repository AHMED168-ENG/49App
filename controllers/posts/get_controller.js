import asyncWrapper from "../../utils/asyncWrapper.js";
import post_model from "../../models/post_model.js";
import user_model from "../../models/user_model.js";
import post_feeling_model from "../../models/post_feeling_model.js";
import post_comment_model from "../../models/post_comment_model.js";
import post_activity_model from "../../models/post_activity_model.js";
import { baseUserKeys } from "../../helper.js";
import * as social from "../social_helper.js"
import mongoose from "mongoose";
export const getTotalReactions=asyncWrapper(async(req,res,next)=>{
    const { language } = req.headers
         
    const post = await post_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(req.params.postId) } }, {
        $project: {
            total_likes: { $size: '$likes' },
            total_wow: { $size: '$wow' },
            total_angry: { $size: '$angry' },
            total_sad: { $size: '$sad' },
            total_love: { $size: '$love' },
        },
    }])

    if (!post) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })

    res.json({
        'status': true,
        'data': post[0],
    })

})
//return null
export const getPostReactions=asyncWrapper(async(req,res,next)=>{
    const { language } = req.headers

    const { page, type } = req.query

    const { user } = req

    var userIds = await getUsersReactions()

    var blockedUsers = []

    if (user)
        blockedUsers = await user_model.findById(user.id).distinct('block')

    const isPostExist = await (post_model.findById(req.params.postId).select('_id')) != null

    if (!isPostExist) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })
    if (userIds.length == 0) return res.json({
        'status': true,
        'data': "nooo"
    })

    const result = await user_model.find({ _id: { $in: userIds.filter(e => !blockedUsers.includes(e)) } }).select('first_name last_name profile_picture cover_picture')

    res.json({
        'status': true,
        'data': result
    })
})
async function getUsersReactions(){
    const type=req.query
    const page=req.query
    if (type == social.reaction.like)
    return (await post_model.findById(req.params.postId, { likes: { $likes: [(((page ?? 1) - 1) * 20), 20] } }).select('likes')).likes

     else if (type ==  social.reaction.love)
    return (await post_model.findById(req.params.postId, { love: { $love: [(((page ?? 1) - 1) * 20), 20] } }).select('love')).love
     
else if (type ==  social.reaction.wow)
    return (await post_model.findById(req.params.postId, { wow: { $wow: [(((page ?? 1) - 1) * 20), 20] } }).select('wow')).wow

else if (type ==  social.reaction.sad)
    return  (await post_model.findById(req.params.postId, { sad: { $sad: [(((page ?? 1) - 1) * 20), 20] } }).select('sad')).sad

else
   return (await post_model.findById(req.params.postId, { angry: { $angry: [(((page ?? 1) - 1) * 20), 20] } }).select('angry')).angry
}

export const getSingle=asyncWrapper(async(req,res,next)=>{
    try{
    const { language } = req.headers

    const { user,post,userData } = req
    
    post._doc.user = userData

    //if the post have feeling or activity id. pull their data and put in post
    await set_Feeling_Activty(post,req)
    //total likes/total love...
   await putReactionsInPost(post,req)
   
    if (post.tags) {
        post._doc.tag_users = await user_model.find({ _id: { $in: post.tags } }).select('first_name last_name profile_picture cover_picture')
        delete post._doc.tags
    }
    res.json({
        'status': true,
        'data': post,
    })
}
catch(err){
    console.log(err)
}
})
async function set_Feeling_Activty(post,req){
    if (post.feeling_id) {
        const feeling = await post_feeling_model.findById(post.feeling_id)
        if (feeling) {
            feeling._doc.name = req.headers.language == 'ar' ? feeling.name_ar : feeling.name_en
            delete feeling._doc.name_ar
            delete feeling._doc.name_en
            post._doc.feeling = feeling
        }
    }

    if (post.activity_id) {
        const activity = await post_activity_model.findById(post.activity_id)
        if (activity) {
            activity._doc.name = req.headers.language == 'ar' ? activity.name_ar : activity.name_en
            delete activity._doc.name_ar
            delete activity._doc.name_en
            post._doc.activity = activity
        }
    }
}
async function putReactionsInPost(post,req){
    await post_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(post.id) } }, {
        //project data first
        $project: {
            total_likes: { $size: '$likes' },
            total_wow: { $size: '$wow' },
            total_angry: { $size: '$angry' },
            total_sad: { $size: '$sad' },
            total_love: { $size: '$love' },
            total_shares: { $size: '$shares' },

            is_like: { $in: [req.user.id, '$likes'] },
            is_wow: { $in: [req.user.id, '$wow'] },
            is_angry: { $in: [req.user.id, '$angry'] },
            is_sad: { $in: [req.user.id, '$sad'] },
            is_love: { $in: [req.user.id, '$love'] },
        },
    }]).exec().then((reactions)=>{
        //put data into post
        const reactsData=reactions[0]
        post._doc.total_likes =reactsData.total_likes
        post._doc.total_wow = reactsData.total_wow
        post._doc.total_angry = reactsData.total_angry
        post._doc.total_sad = reactsData.total_sad
        post._doc.total_love = reactsData.total_love
        post._doc.total_shares = reactsData.total_shares

        //add reaction type number based on islike,islove...
        post._doc.reaction = reactsData.is_like ? 1 : reactsData.is_love ? 2 
        : reactsData.is_wow ? 3 :reactsData.is_sad ? 4 : reactsData.is_angry ? 5 : null
    })
    
}

//for one user and including his friends depending on privacy
export const getGlobalPosts=asyncWrapper(async(req,res,next)=>{
    const { language } = req.headers

    const { page } = req.query
    const userid=req.user.id
    const user = await user_model.findOne({ _id: userid, is_locked: false }).select('hide_posts following friends')

    var friendAndFollowing = user.friends

    user.following.forEach(e => {
        if (!friendAndFollowing.includes(e)) friendAndFollowing.push(e)
    })
                                                              //page for pagination
    const posts = await getPosts(user,userid,friendAndFollowing,page)

      if (posts.length == 0) return res.json({ 'status': true, 'data': [] })

    const userIds = []
    const feelingIds = []
    const activityIds = []

    getIds(posts,activityIds,feelingIds,userIds)
     const reactions=await getReactions(user,posts)
      //get users in userids which are all posts owners
     const usersposted= await user_model.find({ _id: { $in: userIds } }).select('first_name last_name profile_picture cover_picture')
     const feelings=await post_feeling_model.find({ _id: { $in: feelingIds } })
     const activites=await post_activity_model.find({ _id: { $in: activityIds } })
     const comments=await post_comment_model.aggregate([{ $match: { post_id: { $in: posts.map(e => e.id) } } },{ $group: { _id: '$post_id', total: { $sum: 1 } }, },])

    if (!usersposted) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })
      console.log(usersposted)
    posts.forEach(post => {

        post._doc.total_comments = 0
        post._doc.is_comments_enable = true
        post._doc.tag_users = []

        for (const user of usersposted) {
            if (user.id == post.user_id) {
                post._doc.user = user
                break
            }
        }
          //if there is tags put
        if (post.tags) {
            for (const tag of post.tags) {
                for (const user of usersposted) {
                    if (tag == user.id) {
                        post._doc.tag_users.push(user)
                        break
                    }
                }
            }
        }

        delete post._doc.tags

        for (const feeling of feelings) {
            if (feeling.id == post.feeling_id) {

                if (!feeling._doc.name) {
                    feeling._doc.name = language == 'ar' ? feeling.name_ar : feeling.name_en
                    delete feeling._doc.name_ar
                    delete feeling._doc.name_en
                }
                post._doc.feeling = feeling
                delete post._doc.feeling_id
                break
            }
        }

        for (const activity of activites) {
            if (activity.id == post.activity_id) {

                if (!activity._doc.name) {
                    activity._doc.name = language == 'ar' ? activity.name_ar : activity.name_en
                    delete activity._doc.name_ar
                    delete activity._doc.name_en
                }
                post._doc.activity = activity
                delete post._doc.activity_id
                break
            }
        }
        for (const reaction of reactions) {
            if (reaction._id == post.id) {

                post._doc.total_likes = reaction.total_likes
                post._doc.total_wow = reaction.total_wow
                post._doc.total_angry = reaction.total_angry
                post._doc.total_sad = reaction.total_sad
                post._doc.total_love = reaction.total_love
                post._doc.total_shares = reaction.total_shares

                post._doc.reaction = reaction.is_like ? 1 : reaction.is_love ? 2 : reaction.is_wow ? 3 : reaction.is_sad ? 4 : reaction.is_angry ? 5 : null
                break
            }
        }

        for (const totalComments of comments) {
            if (totalComments._id == post.id) {
                post._doc.total_comments = totalComments.total
                break
            }
        }
    })
    res.json({
        'status': true,
        'data': posts.filter(e => e._doc.user != null),
    })
})

async function getPosts(user,user_id,friendAndFollowing,page){
   return await post_model.find({
        _id: { $nin: user.hide_posts }, $or: [
            {
                user_id: user_id,
            },
            {
                privacy: 3, // is Friend
                user_id: { $in: user.friends },
            },
            {
                privacy: 5, // is Friend Or Follower
                user_id: { $in: friendAndFollowing },
            }, {
                privacy: 2, // public
                user_id: { $in: friendAndFollowing },
            },
        ]
    })
        .sort({ createdAt: -1, _id: 1 })
        .skip((((page ?? 1) - 1) * 20))
        .limit(20).select('text user_id location privacy pictures background tags activity_id feeling_id comment_privacy createdAt')
}

function getIds(posts,activityIds,feelingIds,userIds){
     posts.forEach(post => {
        if (!userIds.includes(post.user_id)) userIds.push(post.user_id)
        if (post.feeling_id && !feelingIds.includes(post.feeling_id)) feelingIds.push(post.feeling_id)
        if (post.activity_id && !activityIds.includes(post.activity_id)) activityIds.push(post.activity_id)

        if (post.tags) {
            post.tags.forEach(tag => {
                if (!userIds.includes(tag)) userIds.push(tag)
            })
        }
    })
}

async function getReactions(user,posts){
                                     //if user
    return await  post_model.aggregate(user ? [
        { $match: { _id: { $in: posts.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
                total_shares: { $size: '$shares' },

                is_like: { $in: [user.id, '$likes'] },
                is_wow: { $in: [user.id, '$wow'] },
                is_angry: { $in: [user.id, '$angry'] },
                is_sad: { $in: [user.id, '$sad'] },
                is_love: { $in: [user.id, '$love'] },
            }
        }] : [
        { $match: { _id: { $in: posts.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
                total_shares: { $size: '$shares' },
            }
        }])
}

export const getPeerPosts=asyncWrapper(async(req,res,next)=>{
    
    const { language } = req.headers

    const { page, type } = req.query
     
    const { user } = req

    var isBlocked = false
    var isFriend = false
    var isFollower = false
    if (user) {
        const peerData = await getPeerData(req).then(x=>x[0])
        const userData = await  getPostOwnerStatus(req).then(x=>x[0])
        isBlocked = req.user.isAdmin == false && req.user.isSuperAdmin == false && (peerData.is_blocked == true || userData.is_blocked == true)
        isFriend = peerData.is_friend == true
        isFollower = peerData.is_follower == true
    }

    if (isBlocked) return next({ 'status': 404, 'message': language == 'ar' ? 'الحساب غير موجود' : 'User is Not Exist' })

    var posts = await  getPeerPostss(req,isFriend,isFollower)


    if (posts.length == 0) return res.json({ 'status': true, 'data': [] })

    const feelingIds = []
    const activityIds = []
    const userIds = []
     //get activity and feelingd ids
    posts.forEach(e => {
        if (e.feeling_id && !feelingIds.includes(e.feeling_id)) feelingIds.push(e.feeling_id)
        if (e.activity_id && !activityIds.includes(e.activity_id)) activityIds.push(e.activity_id)
        if (e.tags) {
            e.tags.forEach(tag => {
                if (!userIds.includes(tag)) userIds.push(tag)
            })
        }
    })
    const reactions=await  getPostReactionss(req,posts)
    const userData=await user_model.findById(req.params.peerId).select('first_name last_name profile_picture cover_picture')
    const postsData = await Promise.all([
        user_model.findById(req.params.peerId).select('first_name last_name profile_picture cover_picture'),
        post_feeling_model.find({ _id: { $in: feelingIds } }),
        post_activity_model.find({ _id: { $in: activityIds } }),
       
        post_comment_model.aggregate([
            { $match: { post_id: { $in: posts.map(e => e.id) } } },
            { $group: { _id: '$post_id', total: { $sum: 1 } }, },
        ]),
        user_model.find({ _id: { $in: userIds } }).select(baseUserKeys)
    ])

    if (!postsData[0]) return next({ 'status': 400, 'message': language == 'ar' ? 'الحساب ليس موجود' : 'The Account is not exist' })

    posts.forEach(post => {

        post._doc.total_comments = 0
        post._doc.user = userData
        post._doc.is_comments_enable = true
        post._doc.tag_users = []
          //if there is tags push tags
        if (post.tags) {
            for (const tag of post.tags) {
                for (const user of postsData[5]) {
                    if (tag == user.id) {
                        post._doc.tag_users.push(user)
                        break
                    }
                }
            }
        }
        //if there is feeling put feeling field
        for (const feeling of postsData[1]) {
            if (feeling.id == post.feeling_id) {

                if (!feeling._doc.name) {
                    feeling._doc.name = language == 'ar' ? feeling.name_ar : feeling.name_en
                    delete feeling._doc.name_ar
                    delete feeling._doc.name_en
                }
                post._doc.feeling = feeling
                delete post._doc.feeling_id
                break
            }
        }
         
        for (const activity of postsData[2]) {
            if (activity.id == post.activity_id) {

                if (!activity._doc.name) {
                    activity._doc.name = language == 'ar' ? activity.name_ar : activity.name_en
                    delete activity._doc.name_ar
                    delete activity._doc.name_en
                }
                post._doc.activity = activity
                delete post._doc.activity_id
                break
            }
        }
        for (const reaction of reactions) {
            if (reaction._id == post.id) {

                post._doc.total_likes = reaction.total_likes
                post._doc.total_wow = reaction.total_wow
                post._doc.total_angry = reaction.total_angry
                post._doc.total_sad = reaction.total_sad
                post._doc.total_love = reaction.total_love
                post._doc.total_shares = reaction.total_shares

                post._doc.reaction = reaction.is_like ? 1 : reaction.is_love ? 2 : reaction.is_wow ? 3 : reaction.is_sad ? 4 : reaction.is_angry ? 5 : null
                break
            }
        }

        for (const totalComments of postsData[4]) {
            if (totalComments._id == post.id) {
                post._doc.total_comments = totalComments.total
                break
            }
        }
    })

    res.json({
        'status': true,
        'data': posts
    })
})
async function getPeerPostss(req,isFriend,isFollower){
    const type=req.type
    const page=req.page
    if (req.user && req.user.id == req.params.peerId) {
        return await post_model.find({
            text: type == 2 ? "" : { $ne: "" }, $or: [
                { user_id: req.user.id },
                { tags: { $in: req.user.id } }
            ]
        })
            .sort({ createdAt: -1, _id: 1 })
            .skip((((page ?? 1) - 1) * 20))
            .limit(20).select('text user_id location privacy pictures activity_id feeling_id comment_privacy background tags createdAt')
    }
    else return await post_model.find(isFriend && isFollower ?
        {
            user_id: req.params.peerId,
            text: type == 2 ? "" : { $ne: "" },
            $or: [
                {
                    privacy: 3, // is Friend
                },
                {
                    privacy: 4, // is Follower
                },
                {
                    privacy: 5, // is Friend Or Follower
                },
                {
                    privacy: 2, // public
                },
            ]
        } :
        isFriend ? {
            user_id: req.params.peerId,
            text: type == 2 ? "" : { $ne: "" },
            $or: [
                {
                    privacy: 3, // is Friend
                },
                {
                    privacy: 5, // is Friend Or Follower
                }, {
                    privacy: 2, // public
                },]
        } : isFollower ? {
            user_id: req.params.peerId,
            text: type == 2 ? "" : { $ne: "" },
            $or: [
                {
                    privacy: 4, // is Follower
                },
                {
                    privacy: 5, // is Friend Or Follower
                }, {
                    privacy: 2, // public
                }]
        } : {
            user_id: req.params.peerId,
            text: type == 2 ? "" : { $ne: "" },
            privacy: 2, // public
        })
        .sort({ createdAt: -1, _id: 1 })
        .skip((((page ?? 1) - 1) * 20))
        .limit(20).select('text user_id location privacy pictures activity_id feeling_id comment_privacy tags background createdAt')
}
async function getPeerData(req){
    return  await user_model.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.params.peerId) } }, {
            $project: {
                is_blocked: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [req.user.id, '$block'] },
                is_friend: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [req.user.id, '$friends'] },
                is_follower: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [req.user.id, '$followers'] },
            }
        
        }])
}
async function getPostOwnerStatus(req){
    return await  user_model.aggregate([
        { $match: { _id: req.user.isAdmin == true || req.user.isSuperAdmin == true ? mongoose.Types.ObjectId() : mongoose.Types.ObjectId(req.user.id) } }, {
            $project: {
                is_blocked: { $in: [req.params.userId, '$block'] },
                block: '$block',
            }
        }])
}
async function getPostReactionss(req,result){
    return await post_model.aggregate(req.user ? [
        { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
                total_shares: { $size: '$shares' },
                is_like: { $in: [req.user.id, '$likes'] },
                is_wow: { $in: [req.user.id, '$wow'] },
                is_angry: { $in: [req.user.id, '$angry'] },
                is_sad: { $in: [req.user.id, '$sad'] },
                is_love: { $in: [req.user.id, '$love'] },
            }
        }] : [
        { $match: { _id: { $in: result.map(e => mongoose.Types.ObjectId(e.id)) } } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
                total_shares: { $size: '$shares' },
            }
        }])
}