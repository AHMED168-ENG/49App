import ConflictError from "../../utils/types-errors/conflict-error.js";
import wheel_model from "../../models/wheel/wheel_model.js";
import NotFoundError from "../../utils/types-errors/not-found.js";

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

// spin wheel, return item
const spinWheelService = async () => {
  // --> 1) check if user has wallet, create new wallet
  // --> 2) get random item from wheel
  // --> 3) check item type
  // --> 4) update wallet
  // --> 5) return item
};

// execute if user has 10,000 points in wallet
const changePointToMoneyService = async () => {};

// winners

export {
  createWheelService,
  getWheelService,
  getWheelsService,
  updateWheelService,
};
