import httpStatus from "http-status";
import dotenv from "dotenv";
import {
  createWheelService,
  getWheelService,
  getWheelsService,
  getWheelsServiceWitoutPagination,
  updateWheelService,
  spinWheelService,
} from "../../service/wheel/wheel.js";
import {
  checkIfUserHasWalletService,
  createWheelWalletService,
  getWheelWalletService,
  getWheelWalletsService,
} from "../../service/wheel/wheel_wallet.js";

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
      limit: "66327f7bcf781a81ffa419c3", // refar to wheellimits collection -> contain just one document for all wheels
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

const getRandomWheelController = async (req, res, next) => {
  try {
    // --> 1) get all wheels
    const wheels = await getWheelsServiceWitoutPagination();

    // --> 2) get random wheel
    const randomWheel = wheels[Math.floor(Math.random() * wheels.length)];

    // --> 3) return response to client
    return res.status(httpStatus.OK).json({
      success: true,
      data: {
        wheel: randomWheel,
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

const updateWheelController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { wheelId } = req.params;
    const { name, pricePerPoint, isActive } = req.body;

    // --> 2) update wheel
    await updateWheelService(wheelId, {
      name,
      pricePerPoint,
      isActive,
    });

    // --> 3) return response to client
    return res.status(httpStatus.OK).json({
      success: true,
      message: "wheel updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// spin wheel, return selected item
const spinWheelController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { wheelId } = req.params;

    // --> 2) get random item from wheel
    const selectedItem = await spinWheelService(req.user.id, wheelId);

    // --> 3) return response to client
    return res.status(httpStatus.OK).json({
      success: true,
      data: {
        name: selectedItem.name,
        value: selectedItem.value,
        type: selectedItem.type,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createWheelController,
  getWheelController,
  getRandomWheelController,
  getWheelsController,
  updateWheelController,
  spinWheelController,
};
