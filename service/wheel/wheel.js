import ConflictError from "../../utils/types-errors/conflict-error.js";
import wheel_model from "../../models/wheel/wheel_model.js";

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
      .select("-createdAt -updatedAt");

    // --> 3) return response to client
    return wheel;
  } catch (error) {
    throw error;
  }
};

export { createWheelService, getWheelService };
