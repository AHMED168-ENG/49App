import { body, check, query } from "express-validator";



function getLocation() {
    return [
        check("longitude").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter longitude"
        })),
          check("latitude").notEmpty().withMessage(JSON.stringify({
            ar: "قم بادخال خط الطول",
            en: "Enter latitude"
        })),
    ];
  }


export function sendRideValidation() {
    return [
        check("price").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال السعر",
          en: "Enter price"
      }))
    ];
  }

export function sendClientOfferValidation() {
    return [
        check("price").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال السعر",
          en: "Enter price"
      })),
      check("riderId").notEmpty().withMessage(JSON.stringify({
        ar: "قم بادخال معرف الراكب",
        en: "Enter rider Id"
    }))
    ];
  }

export function addUserRating() {
    return [
        check("rating").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال التقيم",
          en: "Enter price"
      })),
      check("comment").notEmpty().withMessage(JSON.stringify({
        ar: "قم بادخال التعليق",
        en: "Enter comment"
      })),
      check("request_id").notEmpty().withMessage(JSON.stringify({
        ar: "قم بادخال الطلب",
        en: "Enter request "
      })),
      check("category_id").notEmpty().withMessage(JSON.stringify({
        ar: "قم بادخال القسم",
        en: "Enter category "
      }))
    ];
  }

export function acceptRideOfferValidation() {
    return [
        check("notificationId").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال الاشعار",
          en: "Enter notification Id"
      }))
    ];
  }
export function changeRideOfferStatus() {
    return [
        check("status").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال الحاله",
          en: "Enter status"
      }))
    ];
  }

export function addNormalRide() {
    return [
      body("category_id").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال القسم ",
          en: "Enter category id"
      })),
      body("air_conditioner").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال حاله التكيف ",
          en: "Enter air conditioner"
      })),
      body("car_model_year").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال حاله السياره ",
          en: "Enter car model year"
      })),
      body("destination_lng").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال خط الطول",
          en: "Enter longitude"
      })),
      body("destination_lat").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال خط الطول",
          en: "Enter latitude"
      })),
      body("user_lng").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال خط الطول",
          en: "Enter user_lng"
      })),
      body("user_lat").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال خط الطول",
          en: "Enter user_lat"
      })),
        
      // body("phone").notEmpty().withMessage(JSON.stringify({
      //     ar: "قم بادخال المحمول",
      //     en: "Enter phone"
      // })),
        
        // body("time").notEmpty().withMessage(JSON.stringify({
        //     ar: "قم بادخال الوقت",
        //     en: "Enter time"
        // })),
        body("price").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال السعر",
          en: "Enter price"
      })),
        body("passengers").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال الركاب",
          en: "Enter passengers"
      })),

      // body("distance").notEmpty().withMessage(JSON.stringify({
      //     ar: "قم بادخال المسافه",
      //     en: "Enter distance"
      // })),
      
      body("from").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال نقطه البدايه",
          en: "Enter from"
      })),

      body("to").notEmpty().withMessage(JSON.stringify({
          ar: "قم بادخال نقطه البدايه",
          en: "Enter to"
      })),
    ];
  }

  


  
export default getLocation