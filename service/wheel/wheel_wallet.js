import wheel_wallet_model from "../../models/wheel/wheel_wallet_model.js";

const checkIfUserHasWalletService = async (userId) => {
  const wallet = await wheel_wallet_model
    .findOne({ user_id: userId })
    .select("_id");

  if (!wallet) {
    return false;
  }

  return true;
};

const createWheelWalletService = async (userId) => {};

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
  checkIfUserHasWallet,
  createWheelWalletService,
  getWheelWalletService,
  getWheelWalletsService,
  updateWheelWalletService,
  updateWheelWalletForUsersService,
  updateAmountWalletService,
  updatePointsWalletService,
}