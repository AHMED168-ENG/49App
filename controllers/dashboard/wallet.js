import { updateWalletAmountService } from "../../service/dashboard/wallet.js";

const updateWalletAmountController = async (req, res, next) => {
  try {
    // --> 1) get data from request
    const { walletId } = req.params;
    const { amount } = req.body;

    // --> 2) update wallet
    await updateWalletAmountService(walletId, amount);

    // --> 3) return response to client
    res.status(200).json({
      status: true,
      message: "Wallet amount updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { updateWalletAmountController };
