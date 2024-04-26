import { check } from "express-validator"
import handel_validation_errors from "../middleware/handelBodyError.js";
function payValidation(){
    return [
      check("user_id").notEmpty().withMessage(JSON.stringify({
        ar:"الرقم التعريفي للمستخدم مطلوب",
        en: "user id is required"
    })),
      check("gift_id").notEmpty().withMessage(JSON.stringify({
        ar:"الرقم التعريفي للهدية مطلوب",
        en: "gift id is required"
    })),
    check("user_id").custom(async (value, { req }) => {
        const user = await user_model.findById(value).select('_id')
        if (!user)
          return Promise.reject(
            JSON.stringify({
              status: 404,
              message:
                req.headers.language == "ar"
                  ? "المسخدم غير موجود"
                  : "user does not exist",
            })
          );
          return Promise.resolve()
      }),
      handel_validation_errors
    ]
}