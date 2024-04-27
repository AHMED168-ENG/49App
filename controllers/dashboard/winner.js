import asyncWrapper from "../../utils/asyncWrapper.js";
import {createWinnerService , getWinnersService , getWinnerByIdService} from "../../service/dashboard/winner.js"
export const createWinner = asyncWrapper(async (req, res) => {
    const { subscriberId } = req.params
    const winner = await createWinnerService(subscriberId)
    res.status(201).json({ data: "successfully make it winner" })
})

export const getWinners = asyncWrapper(async (req, res) => {
    const {competitionId} = req.query
    const winners = await getWinnersService(competitionId)
    res.status(200).json({ data: winners })
})

export const getWinnerById = asyncWrapper(async (req, res) => {
    const { winnerId } = req.params
    const winner = await getWinnerByIdService(winnerId)
    res.status(200).json({ data: winner })
})