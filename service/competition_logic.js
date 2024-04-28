import auth_model from "../models/auth_model.js";
import competition_model from "../models/competitions/competition_model.js";
import competition_wallet_model from "../models/competitions/competition_wallet_model.js";
import subscriber_model from "../models/competitions/subscriber_model.js";

// const mainCategory = await sub_category_model
// .findById(restaurantData.category_id)
// .select("_id parent");

// need -> userId , category_id
// check if user competition exist ot not (only active competitions)
// check if user subscribed to the competition or not and isBlocked or not
// if above checks is true return true and copetition data and subscriber id
// extarct the competition data
// const {pricePerRequest} = competitionData
// increase the amount of the competition wallet by pricePerRequest for user

const checkIsCompetitionsExist = async (main_category_id) => {
  try {
    const competition = await competition_model.findOne({
      category_id: main_category_id,
      status: true,
    });
    if (!competition) {
      return false;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

const getCompetitionData = async (main_category_id) => {
  try {
    // -> 1) check if main_category_id is provided or not
    if (!main_category_id) {
      return false;
    }

    // -> 2) check if competition exist or not
    const competitionExists = await checkIsCompetitionsExist(main_category_id);

    // -> 3) if competition not exist return false
    if (!competitionExists) {
      return false;
    }

    // -> 4) get competition data
    const competitionData = await competition_model.findOne({
      category_id: main_category_id,
      status: true,
    });

    // -> 5) return competition data
    return competitionData;
  } catch (error) {
    throw error;
  }
};

const checkIsUserSubscribeAndIsBlocked = async (userId, competitionId) => {
  try {
    const subscriber = await subscriber_model.findOne({
      user_id: userId,
      competition_id: competitionId,
    });

    console.log("subscriber", subscriber);

    if (!subscriber) {
      return { isSubscribed: false, isBlocked: false };
    }

    return { isSubscribed: true, isBlocked: subscriber.isBlocked };
  } catch (error) {
    throw error;
  }
};

export const checkIfUserUnique = async (userId) => {
  try {
    // -> 1) get macAddress of the user
    const macAddress = await auth_model
      .findOne({ user_id: userId })
      .select("mac_address");

    // -> 2) check if user is unique or not
    const result = await auth_model.find({ mac_address: macAddress }).count();

    // -> 3) if user is not unique return false
    if (result > 1) {
      return false;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

const getSubscriberId = async (userId, competitionId) => {
  try {
    // -> 1) check if user id and competition id is provided or not
    if (!userId || !competitionId) {
      return false;
    }

    // -> 2) get subscriber id
    const subscriber = await subscriber_model.findOne({
      user_id: userId,
      competition_id: competitionId,
    });

    // -> 3) increase the count of request for the subscriber
    subscriber.countOfRequest++;

    // -> 4) check if user is unique or not
    // const isUnique = await checkIfUserUnique(userId);

    // -> 5) if user is not unique set isFraud to true
    // if (!isUnique) {
    //   subscriber.isFraud = true;
    // }

    // -> 6) save the subscriber
    await subscriber.save();

    // -> 3) return subscriber id
    return {
      subscriberId: subscriber._id,
      countOfRequest: subscriber.countOfRequest,
    };
  } catch (error) {
    throw error;
  }
};

export const increaseCompetitionWalletAmount = async (
  subscriberId,
  competitionId,
  pricePerRequest,
  countOfRequest
) => {
  try {
    // -> 1) get competition wallet
    const competitionWallet = await competition_wallet_model.findOne({
      subscriber_id: subscriberId,
      competition_id: competitionId,
    });

    // -> 2) if competition wallet not exist return false
    if (!competitionWallet) {
      return false;
    }

    // -> 4) save the competition wallet
    competitionWallet.amount = countOfRequest * pricePerRequest;
    await competitionWallet.save();
  } catch (error) {
    throw error;
  }

  return true; // false
};

export const competitionLogic = async (userId, main_category_id) => {
  try {
    // -> 1) check if competition exist or not
    const competitionData = await getCompetitionData(main_category_id);

    // -> 2) if competition not exist return false
    if (!competitionData) {
      return false;
    }

    // -> 3) extract the competition data
    const { pricePerRequest, _id: competitionId } = competitionData;

    // -> 4) check if user subscribed to the competition or not and isBlocked or not
    const { isSubscribed, isBlocked } = await checkIsUserSubscribeAndIsBlocked(
      userId,
      competitionId
    );

    // -> 5) if user not subscribed return false
    if (!isSubscribed) {
      return false;
    }

    // -> 6) check if user is blocked
    if (isBlocked) {
      return false;
    }

    // -> 7) get subscriber id
    const { subscriberId, countOfRequest } = await getSubscriberId(
      userId,
      competitionId
    );

    // -> 8) increase the amount of the competition wallet by pricePerRequest for user
    const result = await increaseCompetitionWalletAmount(
      subscriberId,
      competitionId,
      pricePerRequest,
      countOfRequest
    );

    return true;
  } catch (error) {
    throw error;
  }
};
