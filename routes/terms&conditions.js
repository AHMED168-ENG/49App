import express from 'express'

const router = express.Router()

router.get('/', async (req, res, next) => {
    try {
        res.render("terms_and_condisions/terms_and_condisions")
    } catch (e) {
        next(e)
    }
})

export default router