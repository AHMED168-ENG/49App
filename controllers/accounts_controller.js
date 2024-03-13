import app_manager_model from "../models/app_manager_model.js"
import sub_category_model from "../models/sub_category_model.js"
import wallet_model from "../models/wallet_model.js"


export const calculateWithPaymob = async (amount, subCategoryId, userId, isCard) => {

    const subCategory = await sub_category_model.findById(subCategoryId)

    const appManager = await app_manager_model.findOne({})

    const wallet = await wallet_model.findOne({ user_id: userId })

    if (!subCategory || !appManager || !wallet) return

    const paymentGatewayCuts = (isCard == true ? appManager.pay_mob_constant : 0) + ((appManager.pay_mob_portion * amount) / 100)

    const govermentFees = (amount * (appManager.vat / 100)) + ((amount * appManager.tax) / 100)

    const grossMoney = amount - paymentGatewayCuts - govermentFees

    const overHeadFactor = (subCategory.gross_money + grossMoney) / subCategory.payment_factor

    const netGross = grossMoney - appManager.over_head_constant

    const xFactor = netGross / subCategory.payment_factor

    const clientCashBackProvider = xFactor * subCategory.provider_portion

    const fourtyNineStorage = xFactor * subCategory.portion

    const net = grossMoney - clientCashBackProvider - fourtyNineStorage

    wallet_model.updateOne({ user_id: userId }, { $inc: { provider_cash_back: clientCashBackProvider, gross_money: grossMoney, monthly_balance: grossMoney } }).exec()

    sub_category_model.updateOne({ _id: subCategoryId }, { $inc: { gross_money: grossMoney, over_head_factor: overHeadFactor } }).exec()

    app_manager_model.updateOne({ _id: appManager.id }, {
        $inc: {
            request_storage: (appManager.request_portion * net) / 100,
            call_storage: (appManager.call_portion * net) / 100,
            any_storage: (appManager.any_portion * net) / 100,
            like_storage: (appManager.like_portion * net) / 100,
            view_storage: (appManager.view_portion * net) / 100,
            share_storage: (appManager.share_portion * net) / 100,
            pay_mob_cuts: paymentGatewayCuts,
            amount: amount,
            total_government_fees: govermentFees,
            forty_nine_storage: fourtyNineStorage,
            gross_money: grossMoney,
            total_over_head: overHeadFactor,
        }
    }).exec()

}