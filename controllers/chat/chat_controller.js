import user_model from "../../models/user_model.js";
import subscription_model from "../../models/subscription_model.js";
import call_log_model from "../../models/call_log_model.js.js";
import contact_model from "../../models/contact_model.js";
import mongoose from "mongoose";
/**
 *
 * @param {messageid} req
 * @desc getMessageReactions
 * @method get
 * @route /get-contacts
 * @returns
 */
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
      return res
        .status(200)
        .json({
          message:
            language == "ar" ? "سجل المكالمات فارغ" : "call logs is empty",
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
