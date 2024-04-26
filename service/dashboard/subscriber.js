import subscriber_model from "../../models/competitions/subscriber_model.js";
import BadRequestError from "../../utils/types-errors/bad-request.js";

const getSubscribersService = async ({ pagination }) => {
  try {
    // --> 1) get all subscribers for whole competitions
    const subscribers = await subscriber_model
      .find({})
      .populate("user_id", "name email")
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
  } catch (error) {
    throw error;
  }
};

const getSubscriberByIdService = async (subscriberId) => {
  try {
    // --> 1) check if subscriber exists
    const isSubscriberExists = await subscriber_model.findById(subscriberId);

    if (!isSubscriberExists) {
      throw new BadRequestError("Subscriber not found");
    }

    // --> 2) get subscriber from database
    const subscriber = subscriber_model
      .findById(subscriberId)
      .populate("user_id", "name email")
      .select("user_id isBlocked, isFraud, countOfRequest");

    // --> 3) return response to client
    return subscriber;
  } catch (error) {
    throw error;
  }
};

export { getSubscribersService, getSubscriberByIdService };
