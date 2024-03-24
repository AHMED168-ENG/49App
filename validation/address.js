import { body } from "express-validator";


export function createAddressValidation() {
    return [
        body("longitude").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter longitude"
        })),
        body("latitude").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter latitude"
        })),
        body("address").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال العنوان",
            en: "Enter address"
        })),
        body("city").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال المدينه",
            en: "Enter city"
        })),
        body("state").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال الولايه",
            en: "Enter state"
        }
        )),
    ];
  }
  
export function updateAddressValidation() {
    return [
        body("longitude").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter longitude"
        })),
        body("latitude").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter latitude"
        })),

        body("address").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال العنوان",
            en: "Enter address"
        })),
        
        body("city").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال المدينه",
            en: "Enter city"
        })),
        body("state").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال الولايه",
            en: "Enter state"
        }
        )),
    ];
  }
  
