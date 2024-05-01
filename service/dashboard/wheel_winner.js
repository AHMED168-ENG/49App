import wheel_wallet_model from "../../models/wheel/wheel_wallet_model.js";
import wheel_winner_model from "../../models/wheel/wheel_winner_model.js";
import { createWheelWalletService } from "../wheel/wheel_wallet.js";
import { resetWalletToZeroAmountService } from "../wheel/wheel_wallet.js";
import BadRequestError from "../../utils/types-errors/bad-request.js";

export const createWinnerService = async (userId , wheelId) => {
  // --> 1) check if user has wallet, create new wallet
  const wallet = await wheel_wallet_model.findOne({ user_id: userId });
  if (!wallet) {
    await createWheelWalletService(userId);
  }
  try{
  // --> 2) make it winner and put amount in profit and make amount in wallet 0
    const winner = await wheel_winner_model.create({
    user_id: userId,
    profit: wallet.amount,
    wheel_id: wheelId
  });
  await resetWalletToZeroAmountService(wallet._id);
  return winner
}
  catch(error){
    // --> 3) if failed to reset amount in wallet, delete winner
    await wheel_winner_model.deleteOne({ _id: winner._id });
    throw new BadRequestError("Failed to make it winner");
  }
};

export const getWinnerService = async (winnerId) => {
  const winner = await wheel_winner_model
    .findOne({ _id: winnerId })
    .populate("user_id", "name email")
    .populate("wheel_id", "name")

  return winner;
};

export const getWinnersService = async () => {
  const winners = await wheel_winner_model
    .find()
    .populate("user_id", "name email")
    .populate("wheel_id", "name")
  return winners
};
