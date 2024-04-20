import mongoose from 'mongoose';
const { Schema } = mongoose;

const schema = new Schema({

    request_storage: { type: Number, default: 0 },
    call_storage: { type: Number, default: 0 },
    any_storage: { type: Number, default: 0 },
    like_storage: { type: Number, default: 0 },
    view_storage: { type: Number, default: 0 },
    share_storage: { type: Number, default: 0 },

    request_portion: { type: Number, default: 0 },
    call_portion: { type: Number, default: 0 },
    any_portion: { type: Number, default: 0 },
    like_portion: { type: Number, default: 0 },
    view_portion: { type: Number, default: 0 },
    share_portion: { type: Number, default: 0 },


    welcome_gift: { type: Number, default: 250 },
    referral_gift: { type: Number, default: 10 },
    free_click_gift: { type: Number, default: 750 },


    step_value: { type: Number, default: 2 },
    max_day_gift: { type: Number, default: 10 },

    tax: { type: Number, default: 1.88 },
    vat: { type: Number, default: 14 },


    total_government_fees: { type: Number, default: 0 },

    gross_money: { type: Number, default: 0 },
    total_over_head: { type: Number, default: 0 },

    over_head_constant: { type: Number, default: 0 }, //  total running costs / total_over_head
    running_cost: { type: Number, default: 0 },

    forty_nine_storage: { type: Number, default: 0 },


    pay_mob_cuts: { type: Number, default: 0 },
    pay_mob_constant: { type: Number, default: 0 },
    pay_mob_portion: { type: Number, default: 0 },

    total_amounts: { type: Number, default: 0 },

    interest: { type: Number, default: 6 },



    /////////
    ride_criminal_record: { type: Boolean, default: true },
    ride_technical_examination: { type: Boolean, default: true },
    ride_drug_analysis: { type: Boolean, default: true },

    ride_technical_examination_center_phone: { type: String },
    ride_technical_examination_center_location: { type: String },
    ride_drug_analysis_center_phone: { type: String },
    ride_drug_analysis_center_location: { type: String },

    gift_gross_money: { type: Number, default: 0 },
    gift_portion: { type: Number, default: 0 },
    gift_provider_portion: { type: Number, default: 0 },
    gift_payment_factor: { type: Number, default: 0 },
    gift_over_head_factor: { type: Number, default: 0 },
    
    ride_area_distance: { type: Number, default: 5000 },
    ride_request_duration: { type: Number, default: 10 },
    is_monthly_contest_available: { type: Boolean, default: false },
    monthly_contest_fees: { type: Number, default: 0 },
    monthly_contest_reward: { type: Number, default: 0 },
    instant_pay_number: { type: String },
    high_cost_per_kilo: { type: Number , default : 5 }, // this for hight price per mail  
    price_per_km : { type: Number , default : 4 },
    low_cost_per_kilo: { type: Number , default : 3 }, // this for lowest price per mail 
    ride_request_cash_back : {type : Boolean , default : true},
    constant_y : {type : Number , default : 1},
    constant_z : {type : Number , default : 1},
    trip_ratio : {type : Number , default : 0},
    
}, { versionKey: false, timestamps: true })

export default mongoose.model("app_manager", schema);
