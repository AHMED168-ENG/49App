import httpStatus from "http-status";
import { createWheelItemService } from "../../service/wheel/wheel_items.js";

const createWheelItemController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { wheelId } = req.params;
    const { name, value, type, percentage, isActive } = req.body;

    // --> 2) create wheel item
    await createWheelItemService(wheelId, {
      name,
      value,
      type,
      percentage,
      isActive,
    });

    // --> 3) return response to client
    res.status(httpStatus.CREATED).json({
      status: true,
      message: "Wheel item created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { createWheelItemController };
