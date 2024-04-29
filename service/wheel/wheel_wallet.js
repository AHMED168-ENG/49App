const checkIfUserHasWallet = async (userId) => {};

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
