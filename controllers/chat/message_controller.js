import user_model from "../../models/user_model.js";
import message_model from "../../models/message_model.js";
import mongoose from "mongoose";

/**
 *
 * @param {messageid} req
 * @desc getMessageTotalReactions
 * @method get
 * @route
 * @returns
 */
export const getMessageTotalReactions = async (req, res) => {
  try {
    const { language } = req.headers;
    const messageid = req.params.id;
    const post = await message_model.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(messageid) } },
      {
        $project: {
          total_likes: { $size: "$likes" },
          total_wow: { $size: "$wow" },
          total_angry: { $size: "$angry" },
          total_sad: { $size: "$sad" },
          total_love: { $size: "$love" },
        },
      },
    ]);

    if (!post)
      return next({
        status: 404,
        message:
          language == "ar" ? "الرسالة غير موجودة" : "Message Is not Exist",
      });

    res.json({
      status: true,
      data: post[0],
    });
  } catch (e) {
    console.log(e);
  }
};

/**
 *
 * @param {messageid} req
 * @desc getMessageReactions
 * @method get
 * @route
 * @returns
 */
export const getMessageReactions = async (req, res, next) => {
  try {
    //constants
    const { language } = req.headers;

    const { page, type } = req.query;

    const { user } = req;
    const messageid = req.params.id;
    var usersreacted = [];

    var blockedUsers = [];

    //simple valiation
    const isMessageExist =
      (await message_model.findById(messageid).select("_id")) != null;

    if (!isMessageExist)
      return next({
        status: 404,
        message:
          language == "ar" ? "الرسالة غير موجود" : "Message Is not Exist",
      });

    if (user)
      blockedUsers = await user_model.findById(user.id).distinct("block");

    usersreacted = await getreact(type, page, messageid);
    if (usersreacted.length == 0)
      return next({
        status: 200,
        message:
          language == "ar"
            ? "ليس هناك تفاعلات على الرسالة"
            : "There is no reacts in this message",
      });

    const result = await user_model.find({
      _id: { $in: usersreacted.filter((e) => !blockedUsers.includes(e)) },
    });
    res.json({
      status: true,
      data: result,
    });
  } catch (e) {
    console.log(e);
  }
};

const getreact = async (type, page, messageid) => {
  if (type == reacttype.likes)
    return (
      await message_model
        .findById(messageid, {
          likes: { $likes: [((page ?? 1) - 1) * 20, 20] },
        })
        .select("likes")
    ).likes;
  else if (type == reacttype.love)
    return (
      await message_model
        .findById(messageid, { love: { $love: [((page ?? 1) - 1) * 20, 20] } })
        .select("love")
    ).love;
  else if (type == reacttype.wow)
    return (
      await message_model
        .findById(messageid, { wow: { $wow: [((page ?? 1) - 1) * 20, 20] } })
        .select("wow")
    ).wow;
  else if (type == reacttype.sad)
    return (
      await message_model
        .findById(messageid, { sad: { $sad: [((page ?? 1) - 1) * 20, 20] } })
        .select("sad")
    ).sad;
  else
    return (
      await message_model
        .findById(messageid, {
          angry: { $angry: [((page ?? 1) - 1) * 20, 20] },
        })
        .select("angry")
    ).angry;
};
const reacttype = Object.freeze({
  likes: 1,
  love: 2,
  wow: 3,
  sad: 4,
  angry: 5,
});
