import { check , query } from "express-validator";

export function chargeMony() {
    return [
        check("wallet_number").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال الكارت",
            en: "Enter wallet number"
        })),
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
  