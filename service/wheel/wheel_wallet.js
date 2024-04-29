import wheel_wallet_model from "../../models/wheel/wheel_wallet_model.js";
import ConflictError from "../../utils/types-errors/conflict-error.js";

const checkIfUserHasWalletService = async (userId) => {
  try {
    const wallet = await wheel_wallet_model
      .findOne({ user_id: userId })
      .select("_id");

    if (!wallet) {
      return false;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

const createWheelWalletService = async (userId) => {
  try {
    // --> 1) check if user has wallet
    const isUserHashWheelWallet = await checkIfUserHasWalletService(userId);

    if (isUserHashWheelWallet) {
      throw new ConflictError("Sorry, you already have a wallet");
    }

    // --> 2) create wheel wallet
    await wheel_wallet_model.create({ user_id: userId });
  } catch (error) {
    throw error;
  }
};

const getWheelWalletService = async (userId) => {};

const getWheelWalletsService = async () => {};

const updateWheelWalletService = async (userId, wallet) => {};

const updateWheelWalletForUsersService = async (newAmount) => {};

const updateAmountWalletService = async (userId) => {
  updateWheelWalletService(userId, { amount: newAmount });
};

const updatePointsWalletService = async (userId) => {
  updateWheelWalletService(userId, { points: points });
};

export {
  checkIfUserHasWalletService,
  createWheelWalletService,
  getWheelWalletService,
  getWheelWalletsService,
  updateWheelWalletService,
  updateWheelWalletForUsersService,
  updateAmountWalletService,
  updatePointsWalletService,
};
