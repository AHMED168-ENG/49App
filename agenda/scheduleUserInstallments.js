import { sendNotifications } from '../controllers/notification_controller.js'
import auth_model from '../models/auth_model.js'
import notification_model from '../models/notification_model.js'


export function scheduleUserInstallments(agenda) {
  agenda.define('scheduleUserInstallments', async (data) => {
    var bodyEn =  `تنبيه بدفع قسط المنتج ${data.installment.ad_id.name} `
    var bodyAr = `Product premium payment alert ${data.installment.ad_id.name} `
    var titleEn = `Premium product`
    var titleAr = "قسط المنتج"
    
    await notification_model.create({
        receiver_id: data.installmentsRequest.user_id ,
        user_id: data.installment.user_id,
        tab: 8, /// this tap according to installments 
        text_ar: bodyAr,
        text_en: bodyEn,
        main_category_id: data.installment.ad_id.main_category,
        sub_category_id: data.installment.ad_id.sup_category,  
    })

    auth_model.find({ 'user_id': data.installmentsRequest.user_id }).distinct('fcm').then(
        fcm => sendNotifications(fcm, language == 'ar' ? titleAr : titleEn, language == 'ar' ? bodyAr : bodyEn, 10003))
  })
}
