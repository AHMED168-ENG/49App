import { check , query } from "express-validator";

export function chargeMony() {
    return [
        // check("isCard").notEmpty().withMessage(JSON.stringify({
        //     ar: "قم بادخال الكارت",
        //     en: "Enter card"
        // })),
        check("amount").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter latitude"
        })),

    ];
}
  
export function sendMonyToUser() {
    return [

        check("amount").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter latitude"
        })),
    ];
}
  