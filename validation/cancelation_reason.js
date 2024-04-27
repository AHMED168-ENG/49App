import { check } from "express-validator";


export function cancelReasonCreateValidation() {
    return [
        check("reason").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال السبب",
            en: "enter reason"
        })),
        check("according").notEmpty().withMessage(JSON.stringify({
            ar: "أدخل سبب الإلغاء true يعني عميل false يعني سائق",
            en: "Enter the reason for cancellation true mean client false mean rider"
        })),
    ];
  }
  


export function cancelReasonUpdateValidation() {
    return [

        check("reason").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال السبب",
            en: "enter reason"
        })),

        check("according").notEmpty().withMessage(JSON.stringify({
            ar: "أدخل سبب الإلغاء true يعني عميل false يعني سائق",
            en: "Enter the reason for cancellation true mean client false mean rider"
        })),
        
    ];
  }
  