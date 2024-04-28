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

export { createWheelService };
