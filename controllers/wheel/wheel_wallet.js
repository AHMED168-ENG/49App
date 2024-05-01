import httpStatus from "http-status";
import { getWheelWalletService, getWheelWalletsService } from "../../service/wheel/wheel_wallet.js";

const getWheelWalletController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { walletId } = req.params;

    // --> 2) get wallet
    await getWheelWalletService(walletId);

    // --> 3) return response to client
    res.status(httpStatus.OK).json({
      success: true,
      message: "Get wallet successfully",
    });
  } catch (error) {
    next(error);
  }
};


const getWalletsController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { page, limit } = req.query;

    // --> 2) get wallets
    const { wallets, pagination } = await getWheelWalletsService({
      pagination: {
        page: page ? parseInt(page) : process.env.PAGINATION_PAGE,
        limit: limit ? parseInt(limit) : process.env.PAGINATION_LIMIT,
      },
    });

    // --> 3) return response to client
    return res.status(httpStatus.OK).json({
      success: true,
      data: {
        wallets,
      },
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export { getWheelWalletController, getWalletsController };
