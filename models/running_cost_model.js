import mongoose from 'mongoose'


const schema = new mongoose.Schema({

    note: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    type: { type: Number, required: true },


    /*
        developers,
        admins,
        marketing,
        cashbackPayment,
        customerServices,
        socialMedia,
        adsMedia,
        events,
        lawyers,
        permissions,
        underTabled,
        taxes,
        accounts,
        vo,
        other
    */


    /*
    amount = 20 (client)
    
    payment gateway cuts => payment gateway constant + ((payment gateway portion * amount) / 100) = 1.95
    
    goverment fees = (amount * (vat / 100)) + ( (amount * tax) / 100) 
                          2.8                  0.376          = 3.176
    
    gross money for clinet => amount - payment gateway cuts - goverment fees = 14.874
    
    sub category gross => gross money for all clients in this sub category
    
    over head factor for sub category = sub category gross money / payment factor for subcategory
    
    total over head = all over head for all sub catgeories
    
    over head constant = total running costs / total over head
    
    
    
    __________________________________________________________________________________________________________________
                                                    Cash Back Storage
    
    gross money clinet for this payment (14.874)
    
    net gross = gross money clinet for this payment -  over head constant
    
    (calc xFactor)
    
    xFactor = net gross / sub category payment factor
    
    Client Provider CashBack += xFactor * sub category provider portion
    
    fourty nine storage += xFactor * sub category portion
    
    
    
    net = gross money clinet for this payment (14.874) - client provider cash - fourty nine storage
    
    request storage += net * request portion    
    call storage    += net * call portion
    any storage     += net * any portion
    like storage    += net * like portion
    view storage    += net * view portion
    share storage   += net * share portion
    
    
    */

}, { versionKey: false, timestamps: true })

export default mongoose.model("running_costs", schema);
