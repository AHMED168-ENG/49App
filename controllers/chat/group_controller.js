import chat_group_model from "../../models/chat_group_model.js";
import user_model from "../../models/user_model.js";
import contact_model from "../../models/contact_model.js";
/** ------------------------------------------------------  
 * @desc getGroupMembers
 * @route /get-group-members
 * @method get
 * @access private complete task
 /**  ------------------------------------------------------ */
export const getGroupMembers = async (req, res) => {
  try {
    //constants
    const { language } = req.headers;
    const { page } = req.query;
    const groupId = req.params.id;
    const userid = req.user.id;
    const group = await chat_group_model.findOne(
      {
        _id: groupId,
        members: { $in: userid },
      },
      "admins"
    );
    //simple validations
    if (!group)
      return next({
        status: 200,
        message:
          language == "ar" ? "هذه المجموعة غير موجودة" : "This Group not exist",
      });

    //members in group
    const members = (
      await chat_group_model
        .findOne(
          { _id: groupId },
          { members: { $members: [((page ?? 1) - 1) * 20, 20] } }
        )
        .select("members")
    ).members;

    //validatin 2#
    if (members.length == 0)
      return next({
        status: 200,
        message:
          language == "ar"
            ? "لا يوجد اعضاء في هذا الجروب"
            : "This Group has no members",
      });

    const users = await user_model
      .find({
        _id: { $in: members },
      })
      .select("first_name last_name profile_picture");

    users.forEach((e) => {
      e._doc.is_admin = group.admins.includes(e.id);
    });

    res.json({ status: true, data: users });
  } catch (e) {
    console.log(e);
  }
};

/** ------------------------------------------------------  
 * @desc getGroupdMembers
 * @route /get-group-members
 * @method get
 * @access private complete task
 /**  ------------------------------------------------------ */
export const getGroupdMembersNames = async (req, res) => {
  try {
    //constants
    const { language } = req.headers;
    const groupId = req.params.id;
    const userid = req.user.id;
    const group = await chat_group_model.findOne(
      {
        _id: groupId,
        members: { $in: userid },
      },
      "members"
    );

    //simple validations
    if (!group)
      return next({
        status: 404,
        message:
          language == "ar" ? "هذه المجموعة غير موجودة" : "This Group not exist",
      });

    if (group.members.length == 0)
      return res
        .status(200)
        .json({
          message:
            language == "ar"
              ? "لا يجود اعضاء في هذا الجروب"
              : "there is no members in this group",
        });

    //get all users in current group
    const users = await user_model
      .find({
        _id: { $in: group.members },
      })
      .select("first_name last_name");
    let result = {};
    users.forEach((e) => {
      result[e.id] = `${e.first_name} ${e.last_name}`.trim();
    });

    res.json({ status: true, data: result });
  } catch (e) {
    console.log(e);
  }
};

/** ------------------------------------------------------  
 * @desc getGroupdMembers
 * @route /get-group-members
 * @method get
 * @access private complete task
 /**  ------------------------------------------------------ */
export const getGroups = async (req, res) => {
  try {
    //constants
    const userid = req.user.id;
    const { language } = req.headers;
    console.log(language);
    const contacts = await contact_model
      .find(
        {
          owner_id: userid,
          type: 1,
        },
        "-_id user_id"
      )
      .sort({ createdAt: -1, _id: 1 });
    //simple validation

    if (contacts.length == 0)
      return next({
        status: 200,
        message: language == "ar" ? "ليس هناك جروبات" : "no groups",
      });

    //groups has your saved contacts
    const groups = await chat_group_model.aggregate([
      { $match: { members: { $in: contacts.map((x) => x.user_id) } } },
      {
        $project: {
          user_id: "$_id",
          name: "$name",
          type: "2",
          profile: "$picture",
          owner_id: "$owner_id",
          background: "$background",
          only_admin_chat: "$only_admin_chat",
          only_admin_add_members: "$only_admin_add_members",
          is_member: { $in: [req.user.id, "$members"] },
          is_admin: { $in: [req.user.id, "$admins"] },
          members: "$members",
        },
      },
    ]);
    if (!groups)
      return next({
        status: 200,
        message:
          language == "ar"
            ? "لا يوجد مجموعات لهذا المسخدم"
            : "this user dosent have groups in",
      });

    //all userids of all group members
    const userIds = [];
    groups.map((group) =>
      group.members.map((x) => {
        userIds.push(x);
      })
    );
    const users = await user_model
      .find({
        _id: { $in: userIds },
      })
      .select("first_name last_name");

    groups.forEach((group) => {
      group.members_names = {};

      for (const member of group.members) {
        //user of users in all groups
        for (const user of users) {
          if (member == user.id) {
            group.members_names[user.id] =
              `${user.first_name} ${user.last_name}`.trim();
            break;
          }
        }
      }
      for (const contact of contacts) {
        if (contact.user_id == group._id) {
          group.background = contact.background;
          break;
        }
      }
      delete group.members;
    });
    res.json({ status: true, data: groups });
  } catch (e) {
    console.log(e);
  }
};
