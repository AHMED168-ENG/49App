import { check } from "express-validator";
import post_activity_model from "../models/post_activity_model.js";
import post_feeling_model from "../models/post_feeling_model.js";
import post_model from "../models/post_model.js";
import user_model from "../models/user_model.js";
import handel_validation_errors from "../middleware/handelBodyError.js";
import mongoose from "mongoose";
export const validationCreatePost = () => {
  return [
    check("privacy")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "ادخل حقل الخصوصية",
          en: "enter privacy field",
        })
      ),
    check("text")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "ادخل محتوى المنشور",
          en: "enter post text",
        })
      ),
    check("pictures")
      .notEmpty()
      .withMessage(
        JSON.stringify({
          ar: "ادخل صور المنشور",
          en: "enter post pictures",
        })
      ),
    check("background")
      .custom((value, { req }) => {
        if (!req.body.background) return true;
        if (req.body.background && req.body.text > 200) return false;
      })
      .withMessage(
        JSON.stringify({
          ar: "الكتابة اعلى من 200 حرف على صورة",
          en: "text cannot be over 200 character over background",
        })
      ),

    check("activity_id").custom(async (value, { req }) => {
      return await new Promise(async (resolve, reject) => {
        if (!req.body.activity_id)
          reject(
            JSON.stringify({
              ar: "حقل النشاط مطلوب",
              en: "activity field is required",
            })
          );

        //check if found in database
        try {
          const activity = await post_activity_model.findById(value);
        } catch (err) {
          //cast error or invalid id
          reject(
            JSON.stringify({
              ar: "لا يوجد نشاط ",
              en: "activity is not found with this id",
            })
          );
        }
        resolve(true);
      });
    }),
    check("feeling_id").custom(async (value, { req }) => {
      return await new Promise(async (resolve, reject) => {
        if (!req.body.feeling_id)
          reject(
            JSON.stringify({
              ar: "حقل الاحساس مطلوب",
              en: "feeling field is required",
            })
          );

        //check if found in database
        try {
          const feeling = await post_feeling_model.findById(value);
        } catch (err) {
          //cast error or invalid id
          reject(
            JSON.stringify({
              ar: "لا يوجد احساس ",
              en: "feeling is not found with this id",
            })
          );
        }
        resolve(true);
      });
    }),

    handel_validation_errors,
  ];
};
//const userData = await user_model.findById(post.user_id).select('first_name last_name profile_picture cover_picture')
export const validationGetSingle = () => {
  return [
    check("postId").custom(async (value, { req }) => {
      const post = await post_model
        .findById(value)
        .select(
          "text user_id location privacy pictures tags background activity_id feeling_id comment_privacy createdAt"
        );
      if (!post)
        return Promise.reject(
          JSON.stringify({
            status: 404,
            message:
              req.headers.language == "ar"
                ? "المنشور غير موجود"
                : "Post Is not Exist",
          })
        );
      req.post = post;
    }),

    //check for if user blocked...if comments should be visible to user
    check("user").custom(async (value, { req }) => {
        //getting dta
      const userstatus = await getuserstatus(req);
      userstatus[0].isPostOwner = req.post.user_id == req.user.id;
      const postOwnerStatus = await getpostownerStatus(req);

      //if post woner block user or blocked by user then hide post
      if (
        req.user.isAdmin == false &&
        //req.user.role
        req.user.isSuperAdmin == false &&
        (userstatus[0].is_blocked_byowner ||
          postOwnerStatus[0].is_blocked_byuser)
      )
        return next({
          status: 404,
          message: language == "ar" ? "المنشور غير موجود" : "Post Is not Exist",
        });
      //is comment avaliable for user based on privacy settings
      req.post._doc.is_comments_enable =
        userstatus[0].isPostOwner ||
        req.post.comment_privacy == 2 ||
        (req.post.comment_privacy == 3 && userstatus[0].isFriend) ||
        (req.post.comment_privacy == 4 && userstatus[0].isFollower) ||
        (req.post.comment_privacy == 5 &&
          (userstatus[0].isFriend || userstatus[0].isFollower));
    }),
    handel_validation_errors,
  ];
};
async function getuserstatus(req) {
  return await user_model.aggregate([
    // if post owner blocked by user or friends..
    { $match: { _id: mongoose.Types.ObjectId(req.post.user_id) } },
    {
      $project: {
        //if userid in post owner friends or blocks
        is_blocked_byowner: { $in: [req.user.id, "$block"] },
        is_friend: { $in: [req.user.id, "$friends"] },
        is_follower: { $in: [req.user.id, "$followers"] },
      },
    },
  ]);
}
async function getpostownerStatus(req) {
  return await user_model.aggregate([
    //if the post owner blocked user
    { $match: { _id: mongoose.Types.ObjectId(req.user.id) } },
    {
      $project: {
        is_blocked_byuser: { $in: [req.post.user_id, "$block"] },
      },
    },
  ]);
}

export const PostExists=()=>{
  return [
    check("postId").custom(async (value, { req }) => {
      const post = await post_model
        .findById(value)
        .select(
          "text user_id location privacy pictures tags background activity_id feeling_id comment_privacy createdAt"
        );
      if (!post)
        return Promise.reject(
          JSON.stringify({
            status: 404,
            message:
              req.headers.language == "ar"
                ? "المنشور غير موجود"
                : "Post Is not Exist",
          })
        );
        return Promise.resolve()
    }),
    handel_validation_errors
  ]
}

export const isBlocked=()=>{
  return [
    check("postId").custom(async (value, { req }) => {
      //check diffrent key names but they all have the same value
      if(!value){
        if(req.body.postid) value=req.body.postid
        if(req.params.peerId) value=req.params.postId
        if(!value) return Promise.reject("peerid or post id required")
      }

        const peer= await user_model.aggregate([
          { $match: { _id: mongoose.Types.ObjectId(value) } }, {
              $project: {
                  is_blocked: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [req.user.id, '$block'] },
                  is_friend: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [req.user.id, '$friends'] },
                  is_follower: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [req.user.id, '$followers'] },
              }
          
          }]).then(x=>x[0])
          const user= await user_model.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.user.id) } }, {
                $project: {
                    is_blocked: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [value, '$block'] },
                    is_friend: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [value, '$friends'] },
                    is_follower: req.user.isAdmin || req.user.isSuperAdmin ? false : { $in: [value, '$followers'] },
                }
            
            }]).then(x=>x[0])

            const isBlocked=peer.is_blocked || user.is_blocked
             if(isBlocked) return Promise.reject("post is not avaliable")
        return Promise.resolve()
    }),
    handel_validation_errors
  ]
}
