import mongoose from 'mongoose'


const schema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },

    balance: { type: Number, default: 0 },

    gross_money: { type: Number, default: 0 },

    monthly_balance: { type: Number, default: 0 },

    total: { type: Number, default: 0 },
    months: { type: Number, default: 0 },

    ten_years: { type: Number, default: 0 },
    five_years: { type: Number, default: 0 },

    provider_cash_back: { type: Number, default: 0 },
    refund_storage: { type: Number, default: 0 },

    free_click_storage: { type: Number, default: 0 },

    referral_storage: { type: Number, default: 0 },
    referral_cash_back: { type: Number, default: 0 },

    total_payment: { type: Number, default: 0 },
    total_cash_back: { type: Number, default: 0 },

    today_gift: { type: Number, default: 0 },
    last_gift: { type: String, default: 0 }, //10-1-2022

    total_likes: { type: Number, default: 0 },
    total_views: { type: Number, default: 0 },
    total_shares: { type: Number, default: 0 },

    today_likes: { type: Number, default: 0 },
    today_views: { type: Number, default: 0 },
    today_shares: { type: Number, default: 0 },

}, { versionKey: false, timestamps: true })

export default mongoose.model("wallets", schema);
