import express from 'express'
import { baseUserKeys, verifyToken } from '../../helper.js'
import user_model from '../../models/user_model.js'
import message_model from '../../models/message_model.js'
import contact_model from '../../models/contact_model.js'

import mongoose from 'mongoose'
import subscription_model from '../../models/subscription_model.js'
import call_log_model from '../../models/call_log_model.js.js'
import chat_group_model from '../../models/chat_group_model.js'
import { isTaxiOrCaptainOrScooter } from '../../controllers/ride_controller.js'

const router = express.Router()


router.get('/get-contacts', verifyToken, async (req, res, next) => {

    try {

        const { archived } = req.query

        const user = await user_model.findOne({ _id: req.user.id, is_locked: false, }).select('block')

        if (!user) return res.json({ 'status': true, 'data': [] })

        const contacts = await contact_model.find({
            owner_id: req.user.id,
            type: 1,
            is_archived: archived == 'true',
        }).sort({ createdAt: -1, _id: 1 })

        if (contacts.length == 0) return res.json({ 'status': true, 'data': [] })

        const categoriesIds = []
        const usersIds = [req.user.id]
        var subscriptions = []

        contacts.forEach(e => {
            if (e.category_id && !categoriesIds.includes(e.category_id)) categoriesIds.push(e.category_id)
            if (!usersIds.includes(e.user_id)) usersIds.push(e.user_id)
        })

        const users = await user_model.aggregate([
            { $match: { _id: { $in: usersIds.map(e => mongoose.Types.ObjectId(e)) } } }, {
                $project: {
                    first_name: '$first_name',
                    last_name: '$last_name',
                    profile: '$profile_picture',
                    is_online: '$is_online',
                    last_seen: '$last_seen',
                    privacy: '$privacy_last_seen',
                    is_friend: { $in: [req.user.id, '$friends'] },
                    is_follower: { $in: [req.user.id, '$followers'] },
                }
            }])

        if (categoriesIds.length > 0) {
            subscriptions = await subscription_model.find({ sub_category_id: { $in: categoriesIds }, user_id: { $in: usersIds } }).select('sub_category_id user_id')
        }


        contacts.forEach(e => {
            e._doc.is_blocked = user.block.includes(e.user_id)

            for (const user of users) {
                if (user._id == e.user_id) {

                    e._doc.name = e._doc.name ?? (e.category_id == null ? `${user.first_name.trim()} ${user.last_name.trim()}` : user.first_name)
                    e._doc.profile = e.category_id != null ? '' : user.profile
                    e._doc.is_online = user.is_online
                    e._doc.last_seen = user.last_seen

                    if (user.privacy == 1 || (!user.is_friend && user.privacy == 3) || (!user.is_follower && user.privacy == 4) || ((!user.is_follower || !user.is_friend) && user.privacy == 5))
                        delete e._doc.last_seen
                    delete e._doc.privacy
                    delete e._doc.is_friend
                    delete e._doc.is_follower
                    break
                }
            }

            e._doc.is_chat_enable = e.category_id == null

            if (e.category_id) {

                if (isTaxiOrCaptainOrScooter(e.category_id)) {
                    e._doc.is_chat_enable = true;
                    
                } else {
                    for (const subscription of subscriptions) {
                        if (subscription.sub_category_id == e.category_id && (e.user_id == subscription.user_id || subscription.user_id == req.user.id)) {
                            e._doc.is_chat_enable = true
                            break
                        }
                    }
                }
            }
        })

        res.json({ 'status': true, 'data': contacts.filter(e => e.name) })


    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-call-logs', verifyToken, async (req, res, next) => {

    try {

        const { page } = req.query

        const result = await call_log_model.find({
            $or: [
                {
                    caller_id: req.user.id,
                },
                {
                    user_id: req.user.id,
                }
            ],
        }).sort({ createdAt: -1, _id: 1 }).skip((((page ?? 1) - 1) * 50)).limit(50)

        var userIds = []

        result.forEach(e => {
            if (!userIds.includes(e.user_id)) userIds.push(e.user_id)
            if (!userIds.includes(e.caller_id)) userIds.push(e.caller_id)
        })

        userIds = userIds.filter(e => e != req.user.id)

        const data = await Promise.all([
            user_model.find({ _id: { $in: userIds } }).select(baseUserKeys),
            contact_model.find({
                owner_id: req.user.id,
                user_id: { $in: userIds }
            }).select('user_id owner_id category_id name')
        ])

        const users = data[0]

        const contacts = data[1]

        result.forEach(e => {

            for (const user of users) {

                if (user.id == e.caller_id || user.id == e.user_id) {

                    for (const contact of contacts) {
                        if (contact.user_id == e.caller_id || contact.user_id == e.user_id) {
                            if (contact.category_id != null) {
                                user._doc.first_name = contact.name ?? user.first_name
                                user._doc.profile_picture = ''
                            } else {
                                user._doc.first_name = contact.name ?? `${user.first_name} ${user.last_name}`
                            }
                            break
                        }
                    }

                    user._doc.cover_picture = ''
                    user._doc.last_name = ''

                    e._doc.user = user
                    break
                }
            }
            e._doc.is_caller = req.user.id == e.caller_id
        })

        res.json({
            'status': true,
            'data': result.filter(e => e._doc.user),
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-message-total-reactions/:id', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const post = await message_model.aggregate([{ $match: { _id: mongoose.Types.ObjectId(req.params.id) } }, {
            $project: {
                total_likes: { $size: '$likes' },
                total_wow: { $size: '$wow' },
                total_angry: { $size: '$angry' },
                total_sad: { $size: '$sad' },
                total_love: { $size: '$love' },
            },
        }])

        if (!post) return next({ 'status': 404, 'message': language == 'ar' ? 'الرسالة غير موجودة' : 'Message Is not Exist' })

        res.json({
            'status': true,
            'data': post[0],
        })

    } catch (e) {
        next(e)
    }
})

router.get('/get-message-reactions/:id', verifyToken, async (req, res, next) => {



    try {

        const { language } = req.headers

        const { page, type } = req.query

        const { user } = req

        var userIds = []

        var blockedUsers = []

        if (user)
            blockedUsers = await user_model.findById(user.id).distinct('block')

        const isMessageExist = await (message_model.findById(req.params.id).select('_id')) != null

        if (!isMessageExist) return next({ 'status': 404, 'message': language == 'ar' ? 'الرسالة غير موجود' : 'Message Is not Exist' })

        if (type == 1)
            userIds = (await message_model.findById(req.params.id, { likes: { $likes: [(((page ?? 1) - 1) * 20), 20] } }).select('likes')).likes

        else if (type == 2)
            userIds = (await message_model.findById(req.params.id, { love: { $love: [(((page ?? 1) - 1) * 20), 20] } }).select('love')).love

        else if (type == 3)
            userIds = (await message_model.findById(req.params.id, { wow: { $wow: [(((page ?? 1) - 1) * 20), 20] } }).select('wow')).wow

        else if (type == 4)
            userIds = (await message_model.findById(req.params.id, { sad: { $sad: [(((page ?? 1) - 1) * 20), 20] } }).select('sad')).sad

        else
            userIds = (await message_model.findById(req.params.id, { angry: { $angry: [(((page ?? 1) - 1) * 20), 20] } }).select('angry')).angry

        if (userIds.length == 0) return res.json({
            'status': true,
            'data': []
        })

        const result = await user_model.find({ _id: { $in: userIds.filter(e => !blockedUsers.includes(e)) } }).select(baseUserKeys)

        res.json({
            'status': true,
            'data': result
        })

    } catch (e) {
        console.log(e)
        next(e)
    }
})


/////

router.get('/get-groups', verifyToken, async (req, res, next) => {

    try {

        const user = await user_model.findOne({ _id: req.user.id, is_locked: false, }).select('block')

        if (!user) return next({ 'status': 401, 'message': 'Unauthorized' })

        const contacts = await contact_model.find({
            owner_id: req.user.id,
            type: 2,
        }).sort({ createdAt: -1, _id: 1 })

        if (contacts.length == 0) return res.json({ 'status': true, 'data': [] })

        const groups = await chat_group_model.aggregate([
            { $match: { _id: { $in: contacts.map(e => mongoose.Types.ObjectId(e.user_id)) } } }, {
                $project: {
                    user_id: '$_id',
                    name: '$name',
                    type: '2',
                    profile: '$picture',
                    owner_id: '$owner_id',
                    background: '$background',
                    only_admin_chat: '$only_admin_chat',
                    only_admin_add_members: '$only_admin_add_members',
                    is_member: { $in: [req.user.id, '$members'] },
                    is_admin: { $in: [req.user.id, '$admins'] },
                    members: '$members',
                }
            }])


        const userIds = []

        groups.forEach(e => {
            for (const member of e.members) {
                if (!userIds.includes(member)) userIds.push(member)
            }
        })

        const users = await user_model.find({
            _id: { $in: userIds }
        }).select('first_name last_name')

        groups.forEach(e => {
            e.members_names = {}

            for (const member of e.members) {
                for (const user of users) {
                    if (member == user.id) {
                        e.members_names[user.id] = `${user.first_name} ${user.last_name}`.trim()
                        break
                    }
                }
            }
            for (const contact of contacts) {
                if (contact.user_id == e._id) {
                    e.background = contact.background
                    break
                }
            }
            delete e.members
        })
        res.json({ 'status': true, 'data': groups })


    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-group-members/:id', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const group = await chat_group_model.findOne({
            _id: req.params.id,
            members: { $in: req.user.id }
        }).select('admins')

        if (!group) return next({ status: 404, message: language == 'ar' ? 'هذه المجموعة غير موجودة' : 'This Group not exist' })

        const members = (await chat_group_model.findOne({ _id: req.params.id }, { members: { $members: [(((page ?? 1) - 1) * 20), 20] } }).select('members')).members

        if (members.length == 0) return res.json({ 'status': true, 'data': [] })

        const users = await user_model.find({
            _id: { $in: members }
        }).select('first_name last_name profile_picture')

        users.forEach(e => {
            e._doc.is_admin = group.admins.includes(e.id)
        })

        res.json({ 'status': true, 'data': users })

    } catch (e) {
        console.log(e)
        next(e)
    }
})

router.get('/get-group-members-names/:id', verifyToken, async (req, res, next) => {

    try {

        const { language } = req.headers

        const { page } = req.query

        const group = await chat_group_model.findOne({
            _id: req.params.id,
            members: { $in: req.user.id }
        }).select('members')

        if (!group) return next({ status: 404, message: language == 'ar' ? 'هذه المجموعة غير موجودة' : 'This Group not exist' })

        if (group.members.length == 0) return res.json({ 'status': true, 'data': [] })

        const users = await user_model.find({
            _id: { $in: members }
        }).select('first_name last_name')

        const result = {}

        users.forEach(e => {
            result[e.id] = `${e.first_name} ${e.last_name}`.trim()
        })

        res.json({ 'status': true, 'data': result })

    } catch (e) {
        console.log(e)
        next(e)
    }
})


export default router