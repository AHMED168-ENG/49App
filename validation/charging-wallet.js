import { body } from "express-validator";

export function chargeMony() {
    return [
        body("isCard").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال الكارت",
            en: "Enter card"
        })),
        body("amount").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter latitude"
        })),

    ];
  }
  
export function sendMonyToUser() {
    return [
        body("user_id").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال الكارت",
            en: "Enter card"
        })),
        
        body("amount").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter latitude"
        })),
    ];
  }
  