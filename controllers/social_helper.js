import notification_model from "../models/notification_model.js"
import { sendNotifications } from "./notification_controller.js"
import auth_model from "../models/auth_model.js"
export async function sendNotification(user,peer,post,body){
    if (user.id ==peer.id ||
    (await notification_model.findOne({ receiver_id: peer.id, user_id: user.id, type: 1, is_read: false, direction: post.id })) != null) return;
    const notifcationObject = new notification_model({
        text_ar: body.bodyAr,
        text_en: body.bodyEn,
        receiver_id: peer.id,
        tab: 1,
        user_id: user.id,
        type: 1,
        direction: post.id,
    })

    notifcationObject.save()
    auth_model.find({ user_id:peer.id }).distinct('fcm').then(fcm => {
        if (fcm.length > 0) {
            sendNotifications(
                fcm,
                peer.language == 'ar' ? body.titleAr : body.titleEn,
                peer.language == 'ar' ? body.bodyAr : body.bodyEn,
                1,
                post.id,
            )
        }
    })
}
export const notification_body=Object.freeze({
    likeOnPost:function (user){ 
        return{
    titleAr : 'إعجاب جديد على منشورك',
    titleEn :'New Like On Your Post',
     bodyAr :`قام ${user.first_name.trim()} ${user.last_name.trim()} بالاعجاب على منشورك`,
     bodyEn : `${user.first_name.trim()} ${user.last_name.trim()} liked your post`}},

     newPost:function (user){ 
        return{
    titleAr : "منشور جديد",
    titleEn : "New Post",
     bodyAr :`قام ${user.first_name.trim()} ${user.last_name.trim()} بنشر منشور جديد`,
     bodyEn :`${user.first_name.trim()} ${user.last_name.trim()} has posted a new Post`}},

     newShare:function (user){ 
        return{
    titleAr : 'مشاركة جديدة لمنشورك',
    titleEn : 'New Share For Your Post',
     bodyAr :`قام ${user.first_name.trim()} ${user.last_name.trim()} بمشاركة منشورك`,
     bodyEn :`${user.first_name.trim()} ${user.last_name.trim()} Shared your Post`}},

     newTag:function (user){ 
        return{
    titleAr : "إشارة جديدة",
    titleEn : "New Tag",
     bodyAr : `قام ${user.first_name.trim()} ${user.last_name.trim()} بالإشارة إليك فى منشوره`,
     bodyEn :`${user.first_name.trim()}  ${user.last_name.trim()} has tagged you on his Post`
    }
},
    newComment:function (user){ 
        return{
    titleAr : 'تعليق جديد على منشورك',
    titleEn :'New Comment On Your Post',
     bodyAr :  `قام ${user.first_name.trim()} ${user.last_name.trim()} بالتعليق على منشورك`,
     bodyEn : `${user.first_name.trim()} ${user.last_name.trim()} Commented on your Post`
    }
},

newCommentReply:function (user){ 
    return{
titleAr : 'تعليق جديد على تعليقك',
titleEn :'New Replay On Your Comment',
 bodyAr : `قام ${user.first_name.trim()} ${user.last_name.trim()} بالتعليق على تعليقك`,
 bodyEn : `${user.first_name.trim()} ${user.last_name.trim()} Replayed on your Comment`
}
}
})

export const reaction=Object.freeze({
    like:1,
    love:2,
    wow:3,
    sad:4
})
