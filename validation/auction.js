import { body } from "express-validator";


export function createAuctionValidation() {
    return [
        body("name").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال الاسم",
            en: "Enter name"
        })),
        body("start_price").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال المبلغ المبدئي",
            en: "Enter start price"
        })),
        body("small_price").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال اقل قيمه للمزاد",
            en: "Enter small_price"
        })),
    ];
}


export function addUserAuctionValidation() {
    return [
        body("price").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال المبلغ المبدئي",
            en: "Enter start price"
        })),
    ];
  }
