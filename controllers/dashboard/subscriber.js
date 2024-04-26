import httpStatus from "http-status";
import {
  getSubscriberByIdService,
  getSubscribersService,
  updateSubscriber,
} from "../../service/dashboard/subscriber.js";

const getSubscribersController = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const subscribers = await getSubscribersService({
      pagination: {
        page: page ? parseInt(page) : process.env.PAGINATION_PAGE,
        limit: limit ? parseInt(limit) : process.env.PAGINATION_LIMIT,
      },
    });

    res.status(httpStatus.OK).json({
      status: true,
      data: {
        subscribers: subscribers.data,
      },
      pagination: subscribers.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getSubscriberByIdController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { subscriberId } = req.params;

    // --> 2) get subscriber by id
    const subscriber = await getSubscriberByIdService(subscriberId);

    // --> 3) return response to client
    res.status(httpStatus.OK).json({
      status: true,
      data: {
        subscriber,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateSubscriberBlockStatusController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { subscriberId } = req.params;

    // --> 2) update subscriber block status
    await updateSubscriber(subscriberId, req.body);

    // --> 3) return response to client
    res.status(httpStatus.OK).json({
      status: true,
      message: "Updated subscriber block status successfully",
    });
  } catch (error) {
    next(error);
  }
};

const updateSubscriberFraudStatusController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { subscriberId } = req.params;

    // --> 2) update subscriber fraud status
    await updateSubscriber(subscriberId, req.body);

    // --> 3) return response to client
    res.status(httpStatus.OK).json({
      status: true,
      message: "Updated subscriber fraud status successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getSubscribersController,
  getSubscriberByIdController,
  updateSubscriberBlockStatusController,
  updateSubscriberFraudStatusController,
};
