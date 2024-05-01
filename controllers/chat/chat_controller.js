import user_model from "../../models/user_model.js";
import subscription_model from "../../models/subscription_model.js";
import call_log_model from "../../models/call_log_model.js.js";
import message_model from "../../models/message_model.js";
import contact_model from "../../models/contact_model.js";
import contact_seen_logs from  "../../models/contact_seen_log.js"
import sub_category_model from "../../models/sub_category_model.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import asyncWrapper from "../../utils/asyncWrapper.js";
import httpStatus from "http-status";
import { chat } from "googleapis/build/src/apis/chat/index.js";
import contact_seen_log from "../../models/contact_seen_log.js";
/**
 *
 * @param {messageid} req
 * @desc getMessageReactions
 * @method get
 * @route /get-contacts
 * @returns
 */
export const deleteExpiredChats = async (req, res, next) => {
  const datenow = new Date()
    .toLocaleString("sv-SE", { timeZone: "utc", hour12: true })
    .slice(0, 18);
  // find all contacts that has chatdelete field
  const contacts = await contact_model.find({
    chatdelete_at: { $exists: true },
  });
  if (!contacts.length) return;

  contacts.forEach(async (contact) => {
    //chat delete date is equal or bigger than current date
    const chatdelete_at = new Date(contact.chatdelete_at);
    if (chatdelete_at <= new Date(datenow)) {
      //all messages between these two contacts
      const messages = await message_model.find({
        $or: [
          { receiver_id: contact.owner_id, contact_id: contact.user_id },
          { receiver_id: contact.user_id, contact_id: contact.owner_id },
        ],
      });
      //get the chatdelete date before one day (when use decided to 24 hour delete chat)
      var chatdelete_at_minusday= new Date(chatdelete_at);
      chatdelete_at_minusday.setHours(chatdelete_at.getHours() - 24);
       //delete only last 24 hours messages
      const messages_to_delete = messages.filter((x) => {
        return (
          //message createdat date is equal or bigger than the action started
          new Date(x.createdAt) >=chatdelete_at_minusday &&
          new Date(x.createdAt) <=chatdelete_at
        );
      });
      if(!messages_to_delete.length) return;
      messages_to_delete.forEach((message)=>{
        message.is_deleted=true
        message.type=1
        message.save()
      })
      contact.type = 1;
       contact.chatdelete_at = undefined;
      contact.save();
    }
  });
  // console.log(new Date(contacts[0].chatdelete_at) < new Date(datenow))
};
export const getContacts = async (req, res) => {
  try {
    //from contactsisempty validator
    const contacts = req.contacts;
    //from uservalidation inside verivytoken validation
    const userid = req.user.id;

    const categoriesIds = [];
    const usersIds = [userid];
    var subscriptions = [];

    contacts.forEach((contact) => {
      //if contact has category id
      if (contact.category_id && !categoriesIds.includes(contact.category_id))
        categoriesIds.push(contact.category_id);
      if (!usersIds.includes(contact.user_id)) usersIds.push(contact.user_id);
    });
    //all your saved contacts users data
    const users = await user_model.aggregate([
      {
        $match: {
          _id: { $in: usersIds.map((e) => mongoose.Types.ObjectId(e)) },
        },
      },
      {
        $project: {
          first_name: "$first_name",
          last_name: "$last_name",
          profile: "$profile_picture",
          is_online: "$is_online",
          last_seen: "$last_seen",
          privacy: "$privacy_last_seen",
          is_friend: { $in: [req.user.id, "$friends"] },
          is_follower: { $in: [req.user.id, "$followers"] },
        },
      },
    ]);
    if (categoriesIds.length > 0) {
      subscriptions = await subscription_model
        .find({
          sub_category_id: { $in: categoriesIds },
          user_id: { $in: usersIds },
        })
        .select("sub_category_id user_id");
    }

    // customizing contacts data to send

    contacts.forEach((contact) => {
      //all your saved contacts user data (users)
      for (const user of users) {
        //adds user properties to contact ._doc
        customizeContact(contact, user);
      }

      contact._doc.is_chat_enable = contact.category_id == null;

      if (contact.category_id) {
        if (isTaxiOrCaptainOrScooter(contact.category_id)) {
          contact._doc.is_chat_enable = true;
        } else {
          for (const subscription of subscriptions) {
            if (
              subscription.sub_category_id == contact.category_id &&
              (contact.user_id == subscription.user_id ||
                subscription.user_id == req.user.id)
            ) {
              contact._doc.is_chat_enable = true;
              break;
            }
          }
        }
      }
    });

    res.json({ status: true, data: contacts });
  } catch (e) {
    console.log(e);
  }
};
function customizeContact(contact, user) {
  if (user._id == contact.user_id) {
    // add user data to contact data
    contact._doc.is_blocked = user.block.includes(contact.user_id);
    contact._doc.name =
      contact._doc.name ??
      (contact.category_id == null
        ? `${user.first_name.trim()} ${user.last_name.trim()}`
        : user.first_name);
    contact._doc.profile = contact.category_id != null ? "" : user.profile;
    contact._doc.is_online = user.is_online;
    contact._doc.last_seen = user.last_seen;
    //

    //apply some private instricitons
    if (
      user.privacy == 1 ||
      (!user.is_friend && user.privacy == 3) ||
      (!user.is_follower && user.privacy == 4) ||
      ((!user.is_follower || !user.is_friend) && user.privacy == 5)
    )
      delete contact._doc.last_seen;
    delete contact._doc.privacy;
    delete contact._doc.is_friend;
    delete contact._doc.is_follower;
  }
}
export const deleteChat24Hours = async (req, res, next) => {
  const { id } = req.body;
  const date = new Date();
  //add 24 hour to the current date
  date.setHours(date.getHours() + 24);
  //convert to utc timezone to be usable in crons
  const utcdate = date
    //sv-se to convert it into iso datetime
    .toLocaleString("sv-SE", { hour12: false })
    .slice(0, 18);
  const result = await contact_model
    .findOneAndUpdate({ _id: id }, { chatdelete_at: utcdate })
    .exec();
  if (!result) return next("contact is not found");
  res.status(200).send([]);
};
export const getChatSeenLogs=asyncWrapper(async(req,res,next)=>{
  const {userid}=req.params
  const {page}=req.query
   const issubscribed=await subscription_model.findOne({user_id:req.user.id,sub_category_id:'62ef7cf658c90d4a7ed48120', is_active: true,})
   if(!issubscribed) return res.status(httpStatus.UNAUTHORIZED).send("this user must subscribe")
  const contact_seen_logs=await contact_seen_log.find({
    viewer_id:userid,user_id:req.user.id
  }) .skip(((page ?? 1) - 1) * 50)
  if(!contact_seen_logs) return res.status(200).send([])
  res.status(200).send(contact_seen_logs)
})
//sends firstname and lastname only
/**
 *
 * @param {messageid} req
 * @desc getMessageReactions
 * @method get
 * @route /get-call-logs
 * @returns
 */
export const getCallLogs = async (req, res) => {
  try {
    //constants
    const userid = req.user.id;
    const { page } = req.query;

    //will get call logs either you called or get called
    const call_logs = await call_log_model
      .find({
        $or: [
          {
            caller_id: userid,
          },
          {
            user_id: userid,
          },
        ],
      })
      .sort({ createdAt: -1, _id: 1 })
      .skip(((page ?? 1) - 1) * 50)
      .limit(50);

    //simple validation
    if (!call_logs)
      return res.status(200).json({
        message: language == "ar" ? "سجل المكالمات فارغ" : "call logs is empty",
      });

    var userIds = [];

    call_logs.forEach((e) => {
      //get both caller ids and users ids for this user logs
      if (!userIds.includes(e.user_id)) userIds.push(e.user_id);
      if (!userIds.includes(e.caller_id)) userIds.push(e.caller_id);
    });

    //get the other end user activty only
    userIds = userIds.filter((e) => e != req.user.id);

    const data = await Promise.all([
      user_model.find({ _id: { $in: userIds } }),
      contact_model
        .find({
          owner_id: userid,
          user_id: { $in: userIds },
        })
        .select("user_id owner_id category_id name"),
    ]);
    const users = data[0];
    //the contacts you created and talks to
    const contacts = data[1];

    call_logs.forEach((e) => {
      for (const user of users) {
        //if the other user called or get called
        if (user.id == e.caller_id || user.id == e.user_id) {
          for (const contact of contacts) {
            //if one of your contacts called you  || or you called him
            if (
              contact.user_id == e.caller_id ||
              contact.user_id == e.user_id
            ) {
              user._doc.first_name = `${user.first_name} ${user.last_name}`;
              if (contact.category_id != null) user._doc.profile_picture = "";
              break;
            }
          }
          user._doc.cover_picture = "";
          user._doc.last_name = "";
          e._doc.user = user;
          break;
        }
      }
      //?? iscalled field dosent exists
      e._doc.is_caller = userid == e.caller_id;
    });
    //  console.log(e._doc.user)
    res.json({
      status: true,
      // 'data': call_logs.filter(e => e._doc.user),
      data: call_logs,
    });
  } catch (e) {
    console.log(e);
  }
};
export const getChat = asyncWrapper(async (req, res, next) => {
  const user_id = req.params.user_id;

  const chats = await contact_model.find({
    $or: [
      { owner_id: req.user.id, user_id: user_id },
      { owner_id: user_id, user_id: req.user.id },
    ],
  });
  console.log(chats);
  const messages = await message_model.find({
    $or: [
      { receiver_id: user_id, contact_id: req.user.id },
      { receiver_id: req.user.id, contact_id: user_id },
    ],
  });
});

export const lockChat = asyncWrapper(async (req, res, next) => {
  const { contactid, password } = req.body;
  if ((!contactid, !password))
    return res.send("contactid and password is requried");
  const contact = await contact_model.findOne({ _id: contactid });
  if (contact.password) return next("contact is already locked");
  if (!contact) res.status(404).send("contact not found");
  //set hash password
  bcrypt.hash(password, 10, function (err, hash) {
    if (err) next(err);
    contact.password = hash;
    contact.save();
    res.status(200).send([]);
  });
});
export const unlockChat = asyncWrapper(async (req, res, next) => {
  const { language } = req.headers;
  const { contactid, password } = req.body;
  if ((!contactid, !password))
    return res.send("contactid and password is requried");
  const contact = await contact_model.findOne({ _id: contactid });
  if (!contact.password) return next("contact is already unlocked");

  if (!contact) res.status(404).send("contact not found");

  //compare password before unlock
  bcrypt.compare(password, contact.password, function (err, result) {
    if (!result)
      res
        .status(httpStatus.UNAUTHORIZED)
        .send(language == "ar" ? "الرقم السري خطأ" : "password is incorrect");
    contact.password = undefined;
    contact.save();
    res.status(200).send([]);
  });
});
export const getDeletedMessage = asyncWrapper(async (req, res, next) => {
  const { message_id } = req.params;
  if (!message_id) return next("message id is required");
  const issubscribed=await subscription_model.findOne({user_id:req.user.id,sub_category_id:'62ef7cf658c90d4a7ed48120', is_active: true,})
  if (!issubscribed) return next("this action requries profile subscription");
  const deletedmessage = await message_model.findOne({ _id: message_id });
  if (!deletedmessage) return next("message is not found");

  return res.status(200).send(deletedmessage);
});
