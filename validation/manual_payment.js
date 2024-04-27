import { check } from "express-validator";



export function payWithNumberValidation() {
    return [
        check("number").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال رقم الموبايل",
            en: "Enter mobile number"
        })),
        check("ammount").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال قيمه المبلغ",
            en: "Enter mony ammount"
        })),
        check("subCategory").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال القسم الفرعي",
            en: "Enter sub category"
        })),
        check("mainCategory").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال القسم الاساسي",
            en: "Enter main category"
        })),
        check("numberType").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال نوع الرقم المرسل اليه ",
            en: "Enter number type"
        })),

    ];
}


export function saveResetImageValidation() {
    return [
        check("imageUrl").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال الينك الخاص بالوصل",
            en: "Enter image url"
        })),
        check("subCategory").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال القسم الفرعي",
            en: "Enter sub category"
        })),
        check("mainCategory").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال القسم الاساسي",
            en: "Enter main category"
        }))
    ];
}
  


export function approvedReset() {
    return [
        check("approved").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال القيمه",
            en: "Enter approved value"
        })),
       
    ];
}
  