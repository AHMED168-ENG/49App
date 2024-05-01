import competition_wallet_model from "../../models/competitions/competition_wallet_model.js";
import BadRequestError from "../../utils/types-errors/bad-request.js";

const updateWalletAmountService = async (walletId, amount) => {
  try {
    // --> 1) check if the wallet exists
    const isWalletExists = await competition_wallet_model.findById(walletId);

    if (!isWalletExists) {
      throw new NotFoundError("Wallet not found");
    }

    // --> 2) get wallet
    const wallet = await competition_wallet_model
      .findById(walletId)
      .populate("competition_id", "status")
      .select("amount");

    // --> 3) check if competition is active
    if (!wallet.competition_id.status) {
      throw new BadRequestError(
        "You cannot update the amount in the wallets because the competition has become inactive"
      );
    }

    // --> 4) update the wallet
    await competition_wallet_model.updateOne({ _id: walletId }, { amount });
  } catch (error) {
    throw error;
  }
};

export { updateWalletAmountService };
