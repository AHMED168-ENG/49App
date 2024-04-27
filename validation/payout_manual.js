import { check } from "express-validator";

const monyType = ["wallet_winner" , "ballance" , "wallet"]

export function payoutManualValidation() {
    return [
        check("number").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال رقم الموبايل",
            en: "Enter mobile number"
        })),
        check("ammount").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال قيمه المبلغ",
            en: "Enter mony ammount "
        })),
        check("type").notEmpty().withMessage(JSON.stringify({
            ar: `قم بادخال من اي مكان تسحب المبلغ  ${monyType.join(" , ")} `,
            en: `Enter mony type ${monyType.join(" , ")}`
        })),
    ];
}
  


  