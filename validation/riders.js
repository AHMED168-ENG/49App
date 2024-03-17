import { query } from "express-validator";



function getLocation() {
    return [
        query("longitude").notEmpty().withMessage(JSON.stringify("riders_longitude")),
        query("latitude").notEmpty().withMessage(JSON.stringify("riders_latitude")),
    ];
  }
  
export default getLocation