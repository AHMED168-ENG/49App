import httpStatus from "http-status";
import {
  createWheelItemService,
  deleteWheelItemService,
  getWheelItemService,
  getWheelItemsService,
  updateWheelItemService,
} from "../../service/wheel/wheel_items.js";

const createWheelItemController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { wheelId } = req.params;
    const { name, value, type, percentage, isActive } = req.body;

    // --> 2) create wheel item
    await createWheelItemService(wheelId, {
      wheel_id: wheelId,
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

const getWheelItemsController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { wheelId } = req.params;

    // --> 2) get wheel items
    const wheelItems = await getWheelItemsService(wheelId);

    // --> 3) return response to client
    res.status(httpStatus.OK).json({
      status: true,
      data: {
        wheelItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getWheelItemController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { itemId } = req.params;

    // --> 2) get wheel item
    const wheelItem = await getWheelItemService(itemId);

    // --> 3) return response to client
    res.status(httpStatus.OK).json({
      status: true,
      data: {
        wheelItem,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateWheelItemController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { itemId } = req.params;
    const { name, value, type, percentage, isActive } = req.body;

    // --> 2) update wheel item
    await updateWheelItemService(itemId, {
      name,
      value,
      type,
      percentage,
      isActive,
    });

    // --> 3) return response to client
    res.status(httpStatus.OK).json({
      status: true,
      message: "Updated wheel item successfully",
    });
  } catch (error) {
    next(error);
  }
};

const deleteWheelItemController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { itemId } = req.params;

    // --> 2) delete wheel item
    await deleteWheelItemService(itemId);

    // --> 3) return response to client
    res.status(httpStatus.OK).json({
      status: true,
      message: "Deleted wheel item successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  createWheelItemController,
  getWheelItemsController,
  getWheelItemController,
  updateWheelItemController,
  deleteWheelItemController,
};
