import asyncWrapper from "../../utils/asyncWrapper.js";
import post_model from "../../models/post_model.js";
import post_comment_model from "../../models/post_comment_model.js";
export const editmyPost=asyncWrapper(async(req,res,next)=>{
    const {language}=req.headers
    const {  postId, text } = req.body
         //validation
        if (!postId || !text) return next("postid or text is required")
         const update={text:text}
         
        const result = await post_model.findOneAndUpdate({ $and: [ {_id:postId, user_id:req.user.id } ] },update).select('_id')
        if(!result) return next({ status: 404, message:language == "ar" ? "هذا التعليق ليس موجود بهذا المستخدم او بالرقم التعريفي" : "post is not found with this user of this post id"});
        res.json({
            'status': true
        })
    
})

export const editmyComment=asyncWrapper(async(req,res,next)=>{
    const { comment_id, text } = req.body
    const {language}=req.headers
    //validation
    if (!comment_id || !text)  return next({ status: 404, message:language == "ar" ? "الرقم التعريفي او النص مطلوبين" : "commentid or text is reqired",});

    const result = await post_comment_model.findOneAndUpdate({ _id: comment_id, user_id: req.user.id },{text:text}).select('_id')
     //validation
     if(!result)  return next({ status: 404, message:language == "ar" ? "التعليق ليس موجود بهذا المستخدم او الرقم التعريفي" : "comment is not found with this user or this id",});
    res.json({
        'status': true
    })
})
export const editmyPostPrivacy=asyncWrapper(async(req,res,next)=>{
    const { post_id, privacy } = req.body
      //validation
    if (!post_id || !privacy) return next({ status: 404, message:language == "ar" ? "الرقم التعريفي او الخصوصية مطلوبة" : "post id or privacy is required",});

    const result = await post_model.findOneAndUpdate({ _id: post_id, user_id: req.user.id }, { privacy:privacy }).select('_id')
    //validation
      if(!result)  return next({ status: 404, message:language == "ar" ? "الخصوصية ليست موجودة بهذا المستخدم او الرقم التعريفي" : "Privacy is not found with this user or this id",});
    res.json({
        'status': true
    })
})

export const editcommentsPostPrivacy=asyncWrapper(async(req,res,next)=>{
    const { post_id, privacy } = req.body

    if (!post_id || !privacy) return next({ status: 404, message:language == "ar" ? "الرقم التعريفي او الخصوصية مطلوبة" : "post id or privacy is required",});

    const result = await post_model.findOneAndUpdate({ _id: post_id, user_id: req.user.id }, { comment_privacy: privacy }).select('_id')
    if(!result)  return next({ status: 404, message:language == "ar" ? "الخصوصية ليست موجودة بهذا المستخدم او الرقم التعريفي" : "Privacy is not found with this user or this id",});
    res.json({
        'status': true
    })
})