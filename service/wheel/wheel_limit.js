import { getWheelService } from "./wheel.js";
import {
  getWheelWalletService,
  updateWheelWalletService,
} from "./wheel_wallet.js";

// check user palay counter if it more than 10 times -> user can't play again
const checkUserPlayCounterService = async (userId, wheelId) => {
  try {
    // --> 1) get user wallet
    const wallet = await getWheelWalletService(userId);

    // 2) get wheel by id
    const wheel = await getWheelService(wheelId);

    // --> 2) check if user has played more than 10 times
    if (wallet.count >= wheel.limit.maxCount) {
      return true;
    }

    await updateWheelWalletService(userId, {
      count: wallet.count + 1,
    });
    return false;
  } catch (error) {
    throw error;
  }
};

export { checkUserPlayCounterService };
