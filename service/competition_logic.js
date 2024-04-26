const mainCategory = await sub_category_model
.findById(restaurantData.category_id)
.select("_id parent");

// need -> userId , category_id
// check if user competition exist ot not (only active competitions)
// check if user subscribed to the competition or not and isBlocked or not
// if above checks is true return true and copetition data and subscriber id
// extarct the competition data
// const {pricePerRequest} = competitionData
// increase the amount of the competition wallet by pricePerRequest for user

function checkIsCompetitionsExist(main_category_id) {
    return true; // false
  }
  
  function getCompetitionData(main_category_id) {
    return {}; // competitionData
  }
  
  function checkIsUserSubscribeAndIsBlocked(userId, competitionId) {
    return true; // false
  }
  function getSubscriberId(userId, competitionId) {
    return ""; // subscriberId
  }
  function increaseCompetitionWalletAmount(subscriberId, competitionId, pricePerRequest) {
    competition_wallet_model.findOneAndUpdate(
      { subscriber_id: subscriberId, competition_id: competitionId },
      { $inc: { amount: pricePerRequest } },
      { upsert: true }
    );
    return true; // false
  }
  