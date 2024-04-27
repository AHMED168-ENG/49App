import asyncWrapper from "../utils/asyncWrapper.js"
import {sigInCompetitionService ,getCompetitionsService ,CompetitionByIdService ,deleteSubscriptionByUserService} from "../service/competition_subscriber.js"


/** ------------------------------------------------------
 * @desc  user register in competition
 * @route   /subscriber/:competitionsId
 * @method post
 * @access private
 * @data {userId , competitionId}
 * @return {status , data}
 * ------------------------------------------------------ */
export const signInCompetition = asyncWrapper(async (req, res, next) => {
    const competitionsId = req.params.competitionsId
    const user = req.user
    const walletCreated = await sigInCompetitionService(competitionsId, user.id)
    res.status(201).json({data : walletCreated})
})
/** ------------------------------------------------------
 * @desc  get All Own competitions
 * @route   /subscriber/competitions
 * @method Get
 * @access private
 * @data {userId}
 * @return {status , data}
 * ------------------------------------------------------ */
export const ownCompetitions = asyncWrapper(async (req, res, next) => {
    const user = req.user
    const competitions = await getCompetitionsService(user.id)
    res.status(200).json({data : competitions})
})
/** ------------------------------------------------------
 * @desc  get Own competition by id 
 * @route   /subscriber/competition/:id
 * @method Get
 * @access private
 * @data {competitionId}
 * @return {status , data}
 * ------------------------------------------------------ */
export const  getCompetitionById = asyncWrapper(async (req, res, next) => {
    const competitionId = req.params.id
    const user = req.user
    const result = await CompetitionByIdService(competitionId , user.id)
    res.status(200).json({data : result.competition , duration : result.duration })
})
/** ------------------------------------------------------
 * @desc  Delete Subscription for specific competition 
 * @route   /subscriber/competitions
 * @method Delete
 * @access private
 * @data {userId , competitionId} 
 * @return {status , data}
 * ------------------------------------------------------ */
export const deleteSubscriptionByUser = asyncWrapper(async (req, res, next) => {
    const user = req.user
    const competitionId = req.params.competitionId
    await deleteSubscriptionByUserService(competitionId, user.id)
    res.status(200).json({data : "Deleted successfully"})
})
