import httpStatus from "http-status";
import { getWheelWalletService } from "../../service/wheel/wheel_wallet.js";

const getWheelWalletController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { id } = req.user;

    // --> 2) get wallet
    await getWheelWalletService(id);

    // --> 3) return response to client
    res.status(httpStatus.OK).json({
      success: true,
      message: "Get wallet successfully",
    });
  } catch (error) {
    next(error)
  }
};

// dashboard
const getWalletsController = async (req, res, next) => {};

export { getWheelWalletController, getWalletsController };
