import httpStatus from "http-status";
import { createWheelService } from "../../service/wheel/wheel.js";

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

export { createWheelController };
