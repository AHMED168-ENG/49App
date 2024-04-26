import { getSubscribersService } from "../../service/dashboard/subscriber.js";
import httpStatus from "http-status";

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

export { getSubscribersController };
