import competition_model from "../../models/competitions/competition_model.js"
import subscriber_model from "../../models/competitions/subscriber_model.js"
import competition_wallet_model from "../../models/competitions/competition_wallet_model.js"
import NotFoundError from "../../utils/types-errors/not-found.js"
import  ConflictError  from "../../utils/types-errors/conflict-error.js"
import winner_model from "../../models/competitions/winner_model.js"
import user_model from "../../models/user_model.js"
import auth_model from "../../models/auth_model.js"
import { sendNotification } from "../../controllers/notification_controller.js"
export const createWinnerService = async (subscriberId) => {
    // check is this subscriber exist
    const foundSubscriber = await subscriber_model.findById(subscriberId)
    console.log(foundSubscriber.user_id);
    const user = await user_model.findById(foundSubscriber.user_id)
    if (!foundSubscriber) throw new NotFoundError("Subscriber not found")

    const [ foundCompetition, foundWallet, foundWinner ] = await Promise.all([
        // check if this competition exists
        competition_model.findById(foundSubscriber.competition_id),
        // get the wallet
        competition_wallet_model.findOne({ subscriber_id: subscriberId }),
        // check if winner exit already
        winner_model.findOne({ subscriber_id: subscriberId })
    ])
    if (!foundCompetition && foundCompetition.status !== true) throw new NotFoundError("Competition not found or inactive")
    if (foundWinner) throw new ConflictError("Winner already exists")
 
    if (foundWallet.amount < foundCompetition.withdrawLimit) throw new ConflictError("Competition limit not reached")
    const fcmTokens = await auth_model.find({ 'user_id': user._id }).distinct('fcm')

    const notificationToWinnerEn = `congrats ${user.first_name} you won ${foundCompetition.name} competition`
    const notificationToWinnerAr = `مبروك ${user.first_name}  انت الفائز في${foundCompetition.name} المسابقة`
    const [title, body] = user.language === 'ar' ? ['مبروك انت الفائز' ,notificationToWinnerAr] : ['You Are Winner', notificationToWinnerEn];
    sendNotification( fcmTokens,title,body)
    
    const createdWinner = await winner_model.create({ subscriber_id: foundSubscriber._id, competition_id: foundCompetition._id, user_id: foundSubscriber.user_id , profit : foundCompetition.amount })
    return createdWinner
}

export const getWinnersService = async (competitionId) => {  
    let winnersQuery = winner_model.find();
    // If competitionId is provided, filter winners by competitionId
    if (competitionId) {
        winnersQuery = winnersQuery.where('competition_id').equals(competitionId);
    }
    const winners = await winnersQuery
        .populate('user_id', 'first_name email profile_picture')
        .populate('competition_id' , 'withdrawLimit')
        .populate('subscriber_id' , 'isFraud isBlocked countOfRequest')
        .exec();
    return winners
}
export const getWinnerByIdService = async (winnerId) => {
    const winner = await winner_model.findById(winnerId)
    .populate('user_id', 'first_name email profile_picture')
    .populate('competition_id' , 'withdrawLimit')
    .populate('subscriber_id' , 'isFraud isBlocked countOfRequest')
    .exec();
    return winner
}

