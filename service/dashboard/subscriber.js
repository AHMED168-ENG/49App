import subscriber_model from "../../models/competitions/subscriber_model.js";

const getSubscribersService = async ({ pagination }) => {
  // --> 1) get all subscribers for whole competitions
  const subscribers = await subscriber_model
    .find({})
    .populate("user_id", "name email phone")
    .select("user_id isBlocked, isFraud, countOfRequest")
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .sort({ createdAt: -1 });

  // --> 2) get count of subscribers from database
  const count = await subscriber_model.countDocuments();

  // --> 3) return response to client
  return {
    data: subscribers,
    pagination: {
      countItem: count,
      pageCount: Math.ceil(count / pagination.limit),
    },
  };
};

export { getSubscribersService };
