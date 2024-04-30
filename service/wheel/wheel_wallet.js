import wheel_wallet_model from "../../models/wheel/wheel_wallet_model.js";
import ConflictError from "../../utils/types-errors/conflict-error.js";
import NotFoundError from "../../utils/types-errors/not-found.js";

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

const getWheelWalletService = async (userId) => {
  try {
    // --> 1) check if user has wallet
    const isUserHashWheelWallet = await checkIfUserHasWalletService(userId);

    if (!isUserHashWheelWallet) {
      throw new NotFoundError("Sorry, you don't have a wallet");
    }

    // --> 2) get wheel wallet
    const wallet = await wheel_wallet_model
      .findOne({ user_id: userId })
      .select("_id amount points");

    // --> 3) return wheel wallet
    return wallet;
  } catch (error) {
    throw error;
  }
};

const getWheelWalletsService = async ({ pagination }) => {
  try {
    // --> 1) get wheel wallets
    const wallets = await wheel_wallet_model
      .find()
      .select("_id amount points")
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit);

    // --> 2) get count of wheel wallets from database
    const count = await wheel_wallet_model.countDocuments();

    // --> 3) return response to client
    return {
      wallets,
      pagination: {
        countItem: count,
        pageCount: Math.ceil(count / pagination.limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

const resetWalletsToZeroAmountService = async () => {
  try {
    // --> 1) update all wheel wallets to zero amount
    await wheel_wallet_model.updateMany({}, { amount: 0 });
  } catch (error) {
    throw error;
  }
};

const resetWalletToZeroAmountService = async (walletId) => {
  try {
    // --> 1) update all wheel wallets to zero amount
    await wheel_wallet_model.updateOne({ _id: walletId }, { amount: 0 });
  } catch (error) {
    throw error;
  }
};

const updateWheelWalletService = async (userId, wallet) => {
  try {
    // --> 1) check if wallet exists
    const isWheelWalletExists = await checkIfUserHasWalletService(userId);

    if (!isWheelWalletExists) {
      throw new NotFoundError("Sorry, you don't have a wallet");
    }

    // --> 2) update wheel wallet
    await wheel_wallet_model.updateOne({ user_id: userId }, wallet).select("_id");
  } catch (error) {
    throw error;
  }
};

const increaseAmountInWalletService = async (userId, amount) => {
  // --> 1) check if user has wallet

  const isUserHashWheelWallet = await checkIfUserHasWalletService(userId);

  if (!isUserHashWheelWallet) {
    throw new NotFoundError("Sorry, you don't have a wallet");
  }

  // --> 2) update wheel wallet amount
  await wheel_wallet_model.updateOne({ user_id: userId }, { $inc: { amount } });
};

const updatePointsWalletService = async (userId, points) => {
  updateWheelWalletService(userId, { points: points });
};

export {
  checkIfUserHasWalletService,
  createWheelWalletService,
  getWheelWalletService,
  getWheelWalletsService,
  resetWalletsToZeroAmountService,
  resetWalletToZeroAmountService,
  updateWheelWalletService,
  increaseAmountInWalletService,
  updatePointsWalletService,
};
