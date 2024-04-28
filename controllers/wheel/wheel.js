import httpStatus from "http-status";
import dotenv from "dotenv";
import {
  createWheelService,
  getWheelService,
  getWheelsService,
} from "../../service/wheel/wheel.js";

dotenv.config({ path: "./.env" });

const createWheelController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { name, pricePerPoint, isActive } = req.body;

    // --> 2) create new wheel
    await createWheelService({
      name,
      pricePerPoint,
      isActive,
    });

    // --> 3) return response to client
    return res.status(httpStatus.CREATED).json({
      success: true,
      message: "wheel created successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getWheelController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { wheelId } = req.params;

    // --> 2) get wheel
    const wheel = await getWheelService(wheelId);

    // --> 3) return response to client
    return res.status(httpStatus.OK).json({
      success: true,
      data: {
        wheel,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getWheelsController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { page, limit } = req.query;

    // --> 2) get wheels
    const { wheels, pagination } = await getWheelsService({
      pagination: {
        page: page ? parseInt(page) : process.env.PAGINATION_PAGE,
        limit: limit ? parseInt(limit) : process.env.PAGINATION_LIMIT,
      },
    });

    // --> 3) return response to client
    return res.status(httpStatus.OK).json({
      success: true,
      data: {
        wheels,
      },
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export { createWheelController, getWheelController, getWheelsController };
