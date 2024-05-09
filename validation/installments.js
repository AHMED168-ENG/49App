import { body } from "express-validator";


export function createInstallmentsValidation() {
    return [
        body("name").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال الاسم",
            en: "Enter name"
        })),
        body("start_price").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال المبلغ المبدئي",
            en: "Enter start price"
        })),
        body("number_months").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال عدد الشهور ",
            en: "Enter number months"
        })),
        body("financial_payment").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال قيمه كل قسط ",
            en: "Enter financial payment"
        })),
    ];
}


export function addUserInstallmentsValidation() {
    return [

        body("start_price").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال المبلغ المبدئي",
            en: "Enter start price"
        })),
        body("number_months").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال عدد الشهور ",
            en: "Enter number months"
        })),
        body("financial_payment").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال قيمه كل قسط ",
            en: "Enter financial payment"
        })),
    ];
  }


export function addUserInstallmentsAssetsValidation() {
    return [

        body("images").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال الصور ",
            en: "Enter images"
        })),
    ];
  }
