import dotenv from "dotenv";
import cron from "node-cron";
import { resetWalletsToZeroAmountService } from "../service/wheel/wheel_wallet.js";

dotenv.config({ path: "./.env" });

const resetAllWalletsToZeroAmountJob = cron.schedule(
  process.env.RESETAll_WALLETS_TO_ZERO_AMOUNT,
  async () => {
    await resetWalletsToZeroAmountService();
  }
);

export { resetAllWalletsToZeroAmountJob };
