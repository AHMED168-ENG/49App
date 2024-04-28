import wheel_item_model from "../../models/wheel/wheel_item_model.js";
import ConflictError from "../../utils/types-errors/conflict-error.js";
import NotFoundError from "../../utils/types-errors/not-found.js";

const createWheelItemService = async (wheelId, wheelItem) => {
  try {
    // --> 1) check if the wheel exists
    const isWheelExists = await wheel_item_model
      .findById(wheelId)
      .select("_id");

    if (!isWheelExists) {
      throw new NotFoundError("Sorry, this wheel does not exist");
    }

    // --> 2) check if the wheel item name exists
    const isWheelItemNameExists = await wheel_item_model
      .findOne({
        name: wheelItem.name,
      })
      .select("_id");

    if (isWheelItemNameExists) {
      throw new ConflictError("Sorry, this wheel item name already exists");
    }

    // --> 3) create wheel item
    await wheel_item_model.create(wheelItem);
  } catch (error) {
    throw error;
  }
};

const updateWheelItemService = async (wheelItemId, wheelItem) => {
  try {
    // --> 1) check if the wheel item exists
    const isWheelItemExists = await wheel_item_model.findById(wheelItemId);

    if (!isWheelItemExists) {
      throw new NotFoundError("Sorry, this wheel item does not exist");
    }

    // --> 2) check if the wheel item name exists
    const isWheelItemNameExists = await wheel_item_model.findOne({
      name: wheelItem.name,
    });

    if (isWheelItemNameExists) {
      throw new ConflictError("Sorry, this wheel item name already exists");
    }

    // --> 3) update wheel item
    await wheel_item_model.findByIdAndUpdate({ _id: wheelItemId }, wheelItem);
  } catch (error) {
    throw error;
  }
};

export { createWheelItemService, updateWheelItemService };
