import express from 'express'
import user_model from '../../models/user_model.js'
import { tryVerify, verifyToken } from '../../helper.js'

const router = express.Router()

router.get('/get-males', tryVerify, async (req, res, next) => {

    try {

        const { user } = req

        const users = await user_model.aggregate([
            { $match: { privacy_random_appearance: 2, is_male: true, is_locked: false, profile_picture: {$not : { $regex: '.*MAN.*', $options: 'i' },} } },
            { $sample: { size: 20 } },
            {
                $project: {
                    first_name: '$first_name',
                    last_name: '$last_name',
                    profile_picture: '$profile_picture',
                    cover_picture: '$cover_picture',
                    tinder_picture: '$tinder_picture',
                    is_online: '$is_online',
                    privacy_activity: '$privacy_activity',
                    privacy_receive_messages: '$privacy_receive_messages',
                    is_friend: { $in: [user ? user.id : '', '$friends'] },
                    is_follower: { $in: [user ? user.id : '', '$followers'] },
                }
            }
        ])
        users.forEach(user => {

            user.is_online = user.is_online == true && (user.privacy_activity == 2 || (user.is_friend && user.privacy_activity == 3) || (user.is_follower && user.privacy_activity == 4) || ((user.is_follower || user.is_follower) && user.privacy_activity == 5))
            user.is_message_enable = user.privacy_receive_messages == 2 || (user.is_friend && user.privacy_receive_messages == 3) || (user.is_follower && user.privacy_receive_messages == 4) || ((user.is_follower || user.is_friend) && user.privacy_receive_messages == 5)

            delete user.privacy_receive_messages
            delete user.privacy_activity
        })

        res.json({
            'status': true,
            'data': users,
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})


router.get('/get-females', tryVerify, async (req, res, next) => {

    try {

        const { user } = req

        const users = await user_model.aggregate([
            { $match: { privacy_random_appearance: 2, is_male: false, is_locked: false, profile_picture: {$not : { $regex: '.*' + 'GIRL' + '.*', $options: 'i' }} } },
            { $sample: { size: 20 } },
            {
                $project: {
                    first_name: '$first_name',
                    last_name: '$last_name',
                    profile_picture: '$profile_picture',
                    cover_picture: '$cover_picture',
                    tinder_picture: '$tinder_picture',
                    is_online: '$is_online',
                    privacy_activity: '$privacy_activity',
                    privacy_receive_messages: '$privacy_receive_messages',
                    is_friend: { $in: [user ? user.id : '', '$friends'] },
                    is_follower: { $in: [user ? user.id : '', '$followers'] },
                }
            }
        ])
        users.forEach(user => {

            user.is_online = user.is_online == true && (user.privacy_activity == 2 || (user.is_friend && user.privacy_activity == 3) || (user.is_follower && user.privacy_activity == 4) || ((user.is_follower || user.is_follower) && user.privacy_activity == 5))
            user.is_message_enable = user.privacy_receive_messages == 2 || (user.is_friend && user.privacy_receive_messages == 3) || (user.is_follower && user.privacy_receive_messages == 4) || ((user.is_follower || user.is_friend) && user.privacy_receive_messages == 5)

            delete user.privacy_receive_messages
            delete user.privacy_activity
        })

        res.json({
            'status': true,
            'data': users,
        })
    } catch (e) {
        next(e)
    }
})


router.post('/change-picture', verifyToken, async (req, res, next) => {

    try {

        const { path } = req.body

        if (!path) return next('Bad Request')

        await user_model.updateOne({ _id: req.user.id }, { tinder_picture: path })

        res.json({
            'status': true,
        })
    } catch (e) {
        next(e)
    }
})
export default router