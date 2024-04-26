import asyncWrapper from "../../utils/asyncWrapper.js";
import post_model from "../../models/post_model.js";
import user_model from "../../models/user_model.js";
import post_feeling_model from "../../models/post_feeling_model.js";
import post_activity_model from "../../models/post_activity_model.js";
import post_comment_model from "../../models/post_comment_model.js";
import auth_model from "../../models/auth_model.js";
import notification_model from "../../models/notification_model.js";
import { sendNotifications } from "../notification_controller.js";
import { baseUserKeys } from "../../helper.js";
import * as social from "../social_helper.js"
import mongoose from "mongoose";
import { errorWithLanguages } from "../../utils/errorWithLanguages.js";
let reqq;
export const getMyPosts = asyncWrapper(async (req, res, next) => {
  try {
    const { language } = req.headers;

    const { page, type } = req.query; // type if 1 = posts , 2 = gallery
    const userid = req.user.id;

    // finds posts you posted or you tagged in
    const posts = await post_model
      .find({
        text: type == 2 ? "" : { $ne: "" },
        $or: [{ user_id: userid }, { tags: { $in: userid } }],
      })
      .sort({ createdAt: -1, _id: 1 })
      .skip(((page ?? 1) - 1) * 20)
      .limit(20)
      .select(
        "text user_id location privacy pictures activity_id feeling_id comment_privacy background tags createdAt"
      );

    //validation
    if (posts.length == 0) return res.json({ status: true, data: [] });

    //return  req.userIds, req.feelingIds, req.activtyIds
    get_activitesIdsfromPost(posts, req);

    const postsids = posts.map((e) => e.id);

    //return req.activtyData, req.feelingsData, req.comments, req.users ,req.postsData
    await getPostsData(postsids, req);

    //set all final data before sending... like activtyData,feelings,etc
    setPostsData(posts, req);

    res.json({
      status: true,
      data: posts,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
});
const setPostsData = (posts, req) => {
  posts.forEach((post) => {
    post._doc.total_comments = 0;
    post._doc.is_comments_enable = true;
    post._doc.tag_users = [];

    //set user data that posted
    for (const user of req.users) {
      if (post.user_id == user.id) {
        post._doc.user = user;
        break;
      }
    }
    //set users data that get tagged
    if (post.tags) {
      for (const tag of post.tags) {
        for (const user of req.users) {
          //if this user get tagged
          if (tag == user.id) {
            post._doc.tag_users.push(user);
            break;
          }
        }
      }
    }

    setFeelingData(post, req);
    //set activity field data to post instead of activity_id
    setActivityData(post, req);
    //set reactions to post (total likes,total love)
    setReactionsData(post, req);

    for (const totalComments of req.comments) {
      if (totalComments._id == post.id) {
        post._doc.total_comments = totalComments.total;
        break;
      }
    }
  });
};
const setFeelingData = (post, req) => {
  //if feeling id equals post feeling then set feeling data to post instead of feeling id
  for (const feeling of req.feelingsData) {
    if (feeling.id == post.feeling_id) {
      if (!feeling._doc.name) {
        feeling._doc.name =
          language == "ar" ? feeling.name_ar : feeling.name_en;
        delete feeling._doc.name_ar;
        delete feeling._doc.name_en;
      }
      //  set feeling data to post instead of feeling id
      post._doc.feeling = feeling;
      delete post._doc.feeling_id;
      break;
    }
  }
};
const setReactionsData = (post, req) => {
  //if reaction id equals to post id then set
  for (const reactions of req.reactions) {
    if (reactions._id == post.id) {
      post._doc.total_likes = reactions.total_likes;
      post._doc.total_wow = reactions.total_wow;
      post._doc.total_angry = reactions.total_angry;
      post._doc.total_sad = reactions.total_sad;
      post._doc.total_love = reactions.total_love;
      post._doc.total_shares = reactions.total_shares;

      post._doc.reaction = reactions.is_like
        ? 1
        : reactions.is_love
        ? 2
        : reactions.is_wow
        ? 3
        : reactions.is_sad
        ? 4
        : reactions.is_angry
        ? 5
        : null;
      break;
    }
  }
};
const setActivityData = (post, req) => {
  //if activty id ueqls post activty id...then set activty data instead of activty id
  for (const activity of req.activityData) {
    if (activity.id == post.activity_id) {
      if (!activity._doc.name) {
        activity._doc.name =
          language == "ar" ? activity.name_ar : activity.name_en;
        delete activity._doc.name_ar;
        delete activity._doc.name_en;
      }
      //set activaty data instead of activty_id
      post._doc.activity = activity;
      delete post._doc.activity_id;
      break;
    }
  }
};

function get_activitesIdsfromPost(posts, req) {
  const userIds = [req.user.id];
  const feelingIds = [];
  const activityIds = [];

  posts.forEach((post) => {
    //get all feelings and activites ids from posts to fetch their data later
    if (post.feeling_id && !feelingIds.includes(post.feeling_id))
      feelingIds.push(post.feeling_id);
    if (post.activity_id && !activityIds.includes(post.activity_id))
      activityIds.push(post.activity_id);

    //get all users that posted into userids
    if (!userIds.includes(post.user_id)) userIds.push(post.user_id);

    //get user ids in tags
    if (post.tags) {
      post.tags.forEach((tag) => {
        if (!userIds.includes(tag)) userIds.push(tag);
      });
    }
  });
  //set values to the main function
  req.userIds = userIds; //users that posted or get tagged
  req.feelingIds = feelingIds;
  req.activityIds = activityIds;
}
async function getPostsData(postsids, req) {
  //fetch post feeling and activity data from feeling and activitys ids in posts
  (req.feelingsData = await post_feeling_model.find({
    _id: { $in: req.feelingIds },
  })),
    (req.activityData = await post_activity_model.find({
      _id: { $in: req.activityIds },
    })),
    //project total likes from post
    (req.reactions = await post_model.aggregate([
      { $match: { _id: { $in: postsids } } },
      {
        $project: {
          //get total fields in post table
          total_likes: { $size: "$likes" },
          total_wow: { $size: "$wow" },
          total_angry: { $size: "$angry" },
          total_sad: { $size: "$sad" },
          total_love: { $size: "$love" },
          total_shares: { $size: "$shares" },
          //the react user reacted
          is_like: { $in: [req.userid, "$likes"] },
          is_wow: { $in: [req.userid, "$wow"] },
          is_angry: { $in: [req.userid, "$angry"] },
          is_sad: { $in: [req.userid, "$sad"] },
          is_love: { $in: [req.userid, "$love"] },
        },
      },
    ])),
    //get comments total
    (req.comments = await post_comment_model.aggregate([
      { $match: { post_id: { $in: postsids } } },
      { $group: { _id: "$post_id", total: { $sum: 1 } } },
    ])),
    //users data that posted or get tagged
    (req.users = await user_model
      .find({ _id: { $in: req.userIds } })
      .select(baseUserKeys));
}

//test
export const create = asyncWrapper(async (req, res, next) => {
  const {
    text,
    location,
    privacy,
    pictures,
    activity_id,
    feeling_id,
    tags,
    background,
    travel_from,
    travel_to,
  } = req.body;
  
  const user = await user_model
    .findOne({ _id: req.user.id, is_locked: false })
    .select(baseUserKeys + " friends");

  //get activity and feeling from db

  const object = new post_model({
    user_id: req.user.id,
    text,
    privacy,
    pictures,
    location: location ?? undefined,
    activity_id: activity_id ?? undefined,
    feeling_id: feeling_id ?? undefined,
    tags:
      tags != undefined ? tags.filter((tag) => user.friends.includes(tag)) : [],
    background,
    travel_from,
    travel_to,
  });

  const savedpost = await object.save();

  savedpost._doc.tag_users = [];

  //get all user friends and send them new post notification with saved post result id
  sendPostNotfications(user, savedpost);
  sendTagsNotfications(user, savedpost);

  //get actiity and feeling data from db and add it to savedpost
  add_feeling_activity_data(savedpost, user, req);

  res.json({
    status: true,
    data: savedpost,
  });
});
async function add_feeling_activity_data(savedpost, user, req) {
  const activity = await post_activity_model.findById(req.body.activity_id);
  activity._doc.name =
    req.headers.language == "ar" ? activity.name_ar : activity.name_en;
  delete activity._doc.name_ar;
  delete activity._doc.name_en;

  const feeling = await post_feeling_model.findById(req.body.feeling_id);
  feeling._doc.name =
    req.headers.language == "ar" ? feeling.name_ar : feeling.name_en;
  delete feeling._doc.name_ar;
  delete feeling._doc.name_en;
  delete user._doc.friends;

  savedpost._doc.user = user;
  savedpost._doc.feeling = feeling;
  savedpost._doc.activity = activity;
  savedpost._doc.total_comments = 0;
  savedpost._doc.total_shares = 0;
  savedpost._doc.total_likes = 0;
  savedpost._doc.total_wow = 0;
  savedpost._doc.total_angry = 0;
  savedpost._doc.total_sad = 0;
  savedpost._doc.total_love = 0;
  savedpost._doc.is_comments_enable = true;
}
function sendPostNotfications(user, savedpost) {
  user.friends.forEach((friend) => {
    Promise.all([
      user_model.findById(friend).select("language"),
      auth_model.find({ user_id: friend }).distinct("fcm"),
    ]).then((data) => {
      const friend = data[0];
      const fcm = data[1];

      if (friend && fcm) {
         social.sendNotification(user,friend,savedpost,social.notification_body.newPost(user))
      }
    });
  });
}

async function sendTagsNotfications(savedpost, user) {
  if (savedpost.tags) {
   
    for (const tag of savedpost.tags) {
     
      Promise.all([
        user_model.findById(tag).select("language"),
        auth_model.find({ user_id: tag }).distinct("fcm"),
      ]).then((data) => {
        const tagUser = data[0];
        const fcm = data[1];

        if (tagUser && fcm) {
          const body=social.notification_body(user)
          //reciever id taguser.id
          //serid user.id
           social.sendNotification(user,tagUser,savedpost,body)
        }
      });
    }
    savedpost._doc.tag_users = await user_model
      .find({ _id: { $in: savedpost.tags } })
      .select(baseUserKeys);
    delete savedpost._doc.tags;
  }
}

export const activites = asyncWrapper(async (req, res, next) => {
  const { language } = req.headers;

  const result = await post_activity_model.find({});
  if (!result) return res.status(200).send([]);
  result.forEach((e) => {
    e._doc.name = language == "ar" ? e.name_ar : e.name_en;

    delete e._doc.name_ar;
    delete e._doc.name_en;
  });

  res.json({
    status: true,
    data: result,
  });
});

export const feelings = asyncWrapper(async (req, res, next) => {
  const { language } = req.headers;

  const result = await post_feeling_model.find({});
  if (!result) res.status(200).send([]);
  result.forEach((e) => {
    e._doc.name = language == "ar" ? e.name_ar : e.name_en;

    delete e._doc.name_ar;
    delete e._doc.name_en;
  });

  res.json({
    status: true,
    data: result,
  });
});

export const sharepost=asyncWrapper(async(req,res,next)=>{
  try{
    const { postId } = req.body

    if (!postId) return next('postid is required')
    console.log(postId)
    const post = await post_model.findOneAndUpdate({
        _id: postId ,
        shares: { $nin: req.user.id }
    }, { $addToSet: { shares: req.user.id } }).select('_id user_id')

        //validations
        if(!post) return next("post is not found or user already shared")
        if(req.user.id==post.user_id) return next("post owner cant share")

        const user = await user_model.findById(req.user.id).select('first_name last_name')
        const peer = await user_model.findById(post.user_id).select('language')
        const body=social.notification_body.newShare(user)
        await social.sendNotification(user,peer,post,body)     
    res.json({
        'status': true
    })
  }
  catch(err){
    console.log(err)
  }
})

