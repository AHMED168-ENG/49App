import { query } from "express-validator";



function getLocation() {
    return [
        query("longitude").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال خط الطول",
          en: "Enter longitude"
      })),
        query("latitude").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال خط الطول",
          en: "Enter latitude"
      })),
    ];
  }
  
export default getLocation