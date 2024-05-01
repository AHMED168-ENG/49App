import ConflictError from "../../utils/types-errors/conflict-error.js";
import wheel_model from "../../models/wheel/wheel_model.js";
import NotFoundError from "../../utils/types-errors/not-found.js";
import {
  checkIfUserHasWalletService,
  createWheelWalletService,
  getWheelWalletService,
  updateWheelWalletService,
} from "./wheel_wallet.js";

const createWheelService = async (wheel) => {
  try {
    // --> 1) check if the wheel name exists
    const isWheelNameExists = await wheel_model.findOne({
      name: wheel.name,
    });

    if (isWheelNameExists) {
      throw new ConflictError("Sorry, this wheel name already exists");
    }

    // --> 2) create wheel
    await wheel_model.create(wheel);
  } catch (error) {
    throw error;
  }
};

const getWheelService = async (wheelId) => {
  try {
    // --> 1) check if the wheel exists
    const isWheelExists = await wheel_model.findById(wheelId).select("_id");

    if (!isWheelExists) {
      throw new ConflictError("Sorry, this wheel does not exist");
    }

    // --> 2) get wheel
    const wheel = await wheel_model
      .findById(wheelId)
      .select("-createdAt -updatedAt")
      .populate("items", " _id name value type percentage");

    // --> 3) return response to client
    return wheel;
  } catch (error) {
    throw error;
  }
};

const getWheelsService = async ({ pagination }) => {
  try {
    // --> 1) get wheels
    const wheels = await wheel_model
      .find()
      .select("-createdAt -updatedAt")
      .populate("items", " _id name value type percentage")
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit);

    // --> 2) get count of subscribers from database
    const count = await wheel_model.countDocuments();

    // --> 2) return response to client
    return {
      wheels,
      pagination: {
        countItem: count,
        pageCount: Math.ceil(count / pagination.limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

const getWheelsServiceWitoutPagination = async () => {
  try {
    // --> 1) get wheels
    const wheels = await wheel_model
      .find()
      .select("-createdAt -updatedAt")
      .populate("items", " _id name value type percentage");

    // --> 2) return response to client
    return wheels;
  } catch (error) {
    throw error;
  }
};

const updateWheelService = async (wheelId, wheel) => {
  try {
    // --> 1) check if the wheel exists
    const isWheelExists = await wheel_model.findById(wheelId).select("_id");

    if (!isWheelExists) {
      throw new NotFoundError("Sorry, this wheel does not exist");
    }

    // --> 2) update wheel
    await wheel_model.updateOne({ _id: wheelId }, { ...wheel });
  } catch (error) {
    throw error;
  }
};

const checkUserPointsService = async (userId, item) => {
  try {
    // --> 1) get user wallet
    const wallet = await getWheelWalletService(userId);

    // --> 2) check if user has enough points to change it to money (10,000 points)
    const totalPoints = wallet.points + item.value;

    // --> 3) return true if user has 10,000 points
    if (totalPoints >= 10000) {
      return true;
    }

    // --> 4) return false if user has less than 10,000 points
    return false;
  } catch (error) {
    throw error;
  }
};

// execute if user has 10,000 points in wallet
const changePointToMoneyService = async (userId, item) => {
  try {
    // --> 1) check if user has 10,000 points
    const hasEnoughPoints = await checkUserPointsService(userId, item);

    // --> 3) get user wallet
    const wallet = await getWheelWalletService(userId);

    // --> 2) check if user has 10,000 points
    if (hasEnoughPoints) {
      // --> 4) update wallet
      await updateWheelWalletService(userId, {
        points: wallet.points + item.value - 10000, // subtract 10,000 points
        amount: wallet.amount + 10, // add $10 (10,000 points = $10) constant by /*Mohamed Gamal*/
      });
      return;
    }

    // --> 5) update wallet
    await updateWheelWalletService(userId, {
      points: wallet.points + item.value,
    });

    // --> 6) return response to client
    return;
  } catch (error) {
    throw error;
  }
};

// Method to get a random item from the wheel
const getRandomItem = (wheelItems) => {
  const percentage = wheelItems.reduce((sum, item) => sum + item.percentage, 0);
  const randomValue = Math.random() * percentage;

  let accumulatedProbability = 0;
  for (const item of wheelItems) {
    accumulatedProbability += item.percentage;
    if (randomValue <= accumulatedProbability) {
      return item;
    }
  }

  // If no item is found, return the first item as a fallback
  return wheelItems[0];
};

// spin wheel, return item
const spinWheelService = async (userId, wheelId) => {
  try {
    // --> 1) check if user has wallet, create new wallet
    const walletExists = await checkIfUserHasWalletService(userId);

    // --> 2) check if wallet exists
    if (!walletExists) {
      await createWheelWalletService(userId);
    }

    // --> 3) get wheel
    const wheel = await getWheelService(wheelId);

    // --> 4) get random item from wheel
    const item = getRandomItem(wheel.items);

    // --> 5) check item type
    if (item.type === "point") {
      // --> update wallet
      await changePointToMoneyService(userId, item);
    } else if (item.type === "money") {
      // --> update wallet
      const wallet = await getWheelWalletService(userId);
      await updateWheelWalletService(wallet._id, {
        amount: wallet.amount + item.value,
      });
    }
    // --> 6) return item to client
    return item;
  } catch (error) {
    throw error;
  }
};

export {
  createWheelService,
  getWheelService,
  getWheelsService,
  getWheelsServiceWitoutPagination,
  updateWheelService,
  spinWheelService,
};
