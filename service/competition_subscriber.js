import competition_model from "../models/competitions/competition_model.js"
import subscriber_model from "../models/competitions/subscriber_model.js"
import competition_wallet_model from "../models/competitions/competition_wallet_model.js"
import NotFoundError from "../utils/types-errors/not-found.js"
import  ConflictError  from "../utils/types-errors/conflict-error.js"

export const sigInCompetitionService = async (competitionsId , userId) => {
    const foundCompetition = await competition_model.findById(competitionsId)
    // check if competition is active
    if (!foundCompetition || foundCompetition.status !== true)  throw new NotFoundError("Competition not found")
    // check if competition is full
    if (foundCompetition.currentSubscribers >= foundCompetition.maxSubscriber) throw new ConflictError("Competition is full")
    
    const foundSubscriber = await subscriber_model.findOne({ user_id: userId, competition_id: competitionsId })
    // check if user already subscribed to this competition cause it allow him to subscribe more than once 
    if (foundSubscriber) throw new ConflictError("You are Already subscribed to this competition")

    const [newSubscriber] = await Promise.all([
        // create new subscriber
        subscriber_model.create({user_id: userId,competition_id: competitionsId }),
        // update competition subscribers
        competition_model.updateOne({ _id: foundCompetition._id }, { currentSubscribers: foundCompetition.currentSubscribers + 1 })
    ])
    // create competition wallet
    const createdWallet = await competition_wallet_model.create({subscriber_id: newSubscriber._id,competition_id: competitionsId,
    })
    return createdWallet
}

export const getCompetitionsService = async (userId) => {
    // Fetch all subscriber documents for the given user id
    const foundSubscribers = await subscriber_model.find({ user_id: userId }).lean();

    // Extract competition ids from subscribers
    const competitionIds = foundSubscribers.map(subscriber => subscriber.competition_id);

    // Fetch all competitions corresponding to the extracted competition ids
    const competitions = await competition_model.find({ _id: { $in: competitionIds } }).lean();

    return competitions;
}
export const CompetitionByIdService = async (competitionId) => {
    // Find the competition
    const foundCompetition = await competition_model.findById(competitionId).populate("category_id")

    // Check if competition exists
    if (!foundCompetition) throw new NotFoundError("Competition not found")

    // Check if competition is active
    if (foundCompetition.status !== "active") throw new ConflictError("Competition is finished")

    // Return the competition
    const duration = foundCompetition.duration
    return {competition: foundCompetition, duration: duration};
}

export const deleteSubscriptionByUserService = async (competitionId, userId) => {
    // Find the competition
    const foundCompetition = await competition_model.findById(competitionId);
    // Check if competition exists and is active
    if (!foundCompetition || foundCompetition.status !== "active") {
        throw new NotFoundError("Competition not found or not active");
    }
    // Find the subscriber
    const foundSubscriber = await subscriber_model.findOneAndDelete({ user_id: userId, competition_id: competitionId });
    // Check if subscriber was found
    if (!foundSubscriber) {
        throw new NotFoundError("You are not subscribed to this competition");
    }
    //decrease competition subscribers
    await competition_model.updateOne({ _id: foundCompetition._id }, { currentSubscribers: foundCompetition.currentSubscribers - 1 });
    // Find the competition wallet
    const foundWallet = await competition_wallet_model.findOneAndDelete({ subscriber_id: foundSubscriber._id });
    // Check if subscriber and wallet were found
    if (!foundWallet) {
        throw new NotFoundError("wallet not found");
    }
    return true;
};