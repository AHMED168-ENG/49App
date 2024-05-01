import asyncWrapper from "../../utils/asyncWrapper.js";
import { createWinnerService ,getWinnerService ,getWinnersService } from "../../service/dashboard/wheel_winner.js";


export const createWinnerController = asyncWrapper(async (req, res, next) => {
    const userId = req.params.userId
    const { wheelId } = req.body
    await createWinnerService(userId ,wheelId)
    res.status(201).json({ data: "successfully make it winner" })
})


export const getWinnerController = async (req, res, next) => {
    const { winnerId } = req.params
    const winner = await getWinnerService(winnerId)
    res.status(200).json({ data: winner })
};

export const getWinnersController = async (req, res, next) => {
    const winners = await getWinnersService()
    res.status(200).json({ data: winners })
};

