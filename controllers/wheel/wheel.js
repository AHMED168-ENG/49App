import httpStatus from "http-status";
import {
  createWheelService,
  getWheelService,
} from "../../service/wheel/wheel.js";

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

export { createWheelController, getWheelController };
