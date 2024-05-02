import dotenv from "dotenv";
import cron from "node-cron";
import {
  resetUserWheelCountToZeroService,
  resetWalletsToZeroAmountService,
} from "../service/wheel/wheel_wallet.js";

dotenv.config({ path: "./.env" });

const resetAllWalletsToZeroAmountJob = cron.schedule(
  process.env.RESETAll_WALLETS_TO_ZERO_AMOUNT,
  async () => {
    await resetWalletsToZeroAmountService();
  }
);

const resetAllUserWheelCountToZeroJob = cron.schedule(
  process.env.RESETAll_USER_WHEEL_COUNT_TO_ZERO,
  async () => {
    await resetUserWheelCountToZeroService();
  }
);

export { resetAllWalletsToZeroAmountJob , resetAllUserWheelCountToZeroJob };
