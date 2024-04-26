import asyncWrapper from "../../utils/asyncWrapper.js";
import post_model from "../../models/post_model.js";
export const removePostTag=asyncWrapper(async(req,res,next)=>{
    await post_model.updateOne({ _id: req.params.postId }, { $pull: { tags: req.user.id } })

    res.json({
        'status': true,
    })
})

export const delete_replay=asyncWrapper(async(req,res,next)=>{
    const { replay_id } = req.body

    if (!replay_id)return res.status(404).send("replay is not found")

    const result = await comment_replay_model.findOneAndDelete({ _id: replay_id, user_id: req.user.id }).select('_id')
     
    res.json({
        'status': result,
    })
})

export const hidePost=asyncWrapper(async(req,res,next)=>{
    const { language } = req.headers

    const { post_id } = req.body

    if (!post_id) return next({ 'status': 404, 'message': language == 'ar' ? 'الرقم التعريفي للبوست مطلوب' : 'Post id is required' })

    const post = await post_model.findById(post_id).select('id')

    if (!post) return next({ 'status': 404, 'message': language == 'ar' ? 'المنشور غير موجود' : 'Post Is not Exist' })

    const result = await user_model.findOneAndUpdate({
        _id: req.user.id,
    }, { $addToSet: { hide_posts: post_id } }).select('_id')

    res.json({
        'status': true
    })

})

export const deleteComment=asyncWrapper(async(req,res,next)=>{
    const { comment_id, post_id } = req.body

    if (!comment_id || !post_id) return next({ 'status': 404, 'message': language == 'ar' ? 'الرقم التعريفي للكومنت او للبوست ' : 'comment id or post id is required' })

    var result = false

    result = (await post_comment_model.findOneAndDelete({ _id: comment_id, user_id: req.user.id }).select('_id') != null)

    if (!result) {
        const post = await post_model.findOne({ _id: post_id, user_id: req.user.id }).select('_id')
        if (post) {
            result = (await post_comment_model.findOneAndDelete({ _id: comment_id }).select('_id') != null)
        }
    }

    res.json({
        'status': result,
    })

})

export const deleteMyPost=asyncWrapper(async(req,res,next)=>{
    const result = await post_model.findOneAndDelete({ _id: req.params.postId, user_id: req.user.id }).select('_id')

    if (result) {
        post_comment_model.deleteMany({ post_id: req.params.postId }).exec()
    }
    
    res.json({
        'status': result != null,
    })
})