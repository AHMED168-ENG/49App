import gift_model from "../../models/gift_model.js"
import user_model from "../../models/user_model.js"
export const getGifts=async(req,res,next)=>{
    const { language } = req.headers

    const result = await gift_model.find({})

    result.forEach(e => {
        e._doc.name = language == 'ar' ? e.name_ar : e.name_en

        delete e._doc.name_ar
        delete e._doc.name_en
    })

    res.json({
        'status': true,
        'data': result
    })
}
export const pay=async(req,res,next)=>{
    const { language } = req.headers

    const { user_id, gift_id, wallet_number } = req.body

    const gift = await gift_model.findById(gift_id)

    const senderUser = await user_model.findById(req.user.id).select('_id phone_number first_name last_name country_code')

    const user = await user_model.findById(user_id).select('_id')

    if (!senderUser._doc.phone_number) senderUser._doc.phone_number = 'NA'
    if (!senderUser._doc.first_name) senderUser._doc.first_name = 'NA'
    if (!senderUser._doc.last_name) senderUser._doc.last_name = 'NA'


    const paymentToken = await getPaymobToken()
    const orderId = await makeOrder(paymentToken, gift.value * 100)
    const iFrameToken = await paymentKeys(paymentToken, orderId, gift.value * 100,
        {
            'phone_number': `${senderUser.country_code}${senderUser._doc.phone_number}`,
            'first_name': senderUser._doc.first_name,
            'last_name': senderUser._doc.last_name,
            'email': 'NA',
            'floor': 'NA',
            'city': 'NA',
            'building': 'NA',
            'apartment': 'NA',
            'street': "NA",
            'postal_code': "NA",
            'country': "NA",
            'state': "NA",
            'shipping_method': 'NA',
            'extra_description': JSON.stringify({
                'method_type': 'gift',
                'sender_id': req.user.id,
                'user_id': user_id,
                'gift_id': gift_id,
                'is_card': wallet_number.length == 0,
            })
        }, wallet_number.length == 0,
    )

    var url = `https://accept.paymob.com/api/acceptance/iframes/354120?payment_token=${iFrameToken}`

    if (wallet_number.length > 0) {
        url = await makeWalletOrder(iFrameToken, wallet_number)
    }

    res.json({
        'status': true,
        'data': url
    })

}