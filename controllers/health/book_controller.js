import user_model from "../../models/user_model.js";
import sub_category_model from "../../models/sub_category_model.js";
import notification_model from "../../models/notification_model.js";
import auth_model from "../../models/auth_model.js";
import rating_model from "../../models/rating_model.js";
import { healthCategoryId } from "../ride_controller.js";
import { sendNotifications } from "../notification_controller.js";
import main_category_model from "../../models/main_category_model.js";
import subscription_model from "../../models/subscription_model.js";
import doctor_model from "../../models/doctor_model.js";
import patient_book_model from "../../models/patient_book_model.js";
import { requestCashBack } from "../cash_back_controller.js";
import { check } from "express-validator";

export const getDoctorBooks = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers;
    // extract page from query
    const { page } = req.query;
    // check if doctor exist or not and get (user_id, category_id)
    const doctor = await doctor_model
      .findOne({ user_id: req.user.id })
      .select("_id category_id");
    // if not exist send error
    if (!doctor) return next("doctor not found");

    // get all books of doctor and sort by date, and skip and limit by 20 books
    const books = await patient_book_model
      .find({ doctor_id: req.user.id })
      .sort({ createdAt: -1, _id: 1 })
      .skip(((page ?? 1) - 1) * 20)
      .limit(20);

    // get sub category of doctor and select (name_ar, name_en)
    const category = await sub_category_model
      .findById(doctor.category_id)
      .select("name_ar name_en");
    // get the number of total books of doctor
    const totalBooks = await patient_book_model
      .find({ user_id: req.user.id })
      .count();
    // set total number of books of doctor
    doctor._doc.total = totalBooks;
    // get ratings of doctor
    const ratings = await rating_model.find({
      category_id: category.id,
      ad_id: { $in: books.map((e) => e.id) },
    });

    // loop on books and add rating to it.
    for (const order of books) {
      for (const rating of ratings) {
        if (order.id == rating.ad_id) {
          order._doc.rating = rating;
          break;
        }
      }
      // set sub category of book
      order._doc.sub_category =
        language == "ar" ? category.name_ar : category.name_en;
    }

    res.json({
      status: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

export const createBook = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers;

    const { id, category_id, book_time } = req.body;
    // ON VALIDATE
    if (!id || !category_id || !book_time) return next("Bad Request");
    // check if user exist or not and get (user_id)
    const user = await user_model.findById(req.user.id).select("_id");

    // check if doctor exist or not and get (user_id)
    const doctor = await doctor_model
      .findOne({ user_id: id, category_id, is_approved: true, is_active: true })
      .select("user_id");
    // check is doctor exist in user model or not
    const doctorUser = await user_model
      .findOne({ user_id: doctor.user_id })
      .select("language");
    // get sub category of doctor and select (name_ar, name_en)
    const subCategory = await sub_category_model
      .findById(category_id)
      .select("name_ar name_en");

    if (!user || !doctor || !subCategory || !doctorUser)
      return next({ status: 404, message: "Doctor Not Found" });
    // create new book and save it in patient_book_model
    const book = new patient_book_model({
      category_id: category_id,
      doctor_id: doctor.user_id,
      user_id: req.user.id,
      book_time,
    });

    book.save();

    const titleAr = `حجز ${subCategory.name_ar} جديد`;
    const titleEn = `New ${subCategory.name_en} Book`;
    const bodyEn = `New ${subCategory.name_en} Book, Patient Book a Session in your clinic at ${book_time}`;
    //const bodyAr = `يوم حجز ${subCategory.name_ar} مريض يحجز جلسة في عيادتك\n${book_time} `

    const bodyAr = `مريض يريد ان يحجز في عيادتك ${subCategory.name_ar} \n يوم ${book_time}`;

    // create notification for doctor and save it in notification_model
    const notificationObject = new notification_model({
      receiver_id: doctor.user_id,
      user_id: req.user.id,
      sub_category_id: category_id,
      tab: 2,
      text_ar: bodyAr,
      text_en: bodyEn,
      direction: doctor.user_id,
      main_category_id: healthCategoryId,
      type: 10008,
      ad_owner: doctor.user_id,
      is_accepted: true,
    });

    notificationObject.save();
    // create request for doctor and save it in doctor_model
    doctor_model
      .findOne({ user_id: id, requests: { $nin: [req.user.id] } })
      .then((r) => {
        if (r) {
          doctor_model
            .updateOne(
              { user_id: id },
              { $addToSet: { requests: req.user.id } }
            )
            .exec();
          // request cashback to give cash back to user
          requestCashBack(req.user.id, language);
        }
      });
    // verify user and send notification to doctor
    auth_model
      .find({ user_id: doctor.user_id })
      .distinct("fcm")
      .then((fcm) => {
        sendNotifications(
          fcm,
          doctorUser.language == "ar" ? titleAr : titleEn,
          doctorUser.language == "ar" ? bodyAr : bodyEn,
          10008
        );
      });

    res.json({
      status: true,
    });
  } catch (e) {
    next(e);
  }
};

//************************************************************************************ */

export const getUserBooks = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers;
    // extract page from query
    const { page } = req.query;
    // get all user books and sort by date, and skip and limit by 20 books
    const result = await patient_book_model
      .find({ user_id: req.user.id })
      .sort({ createdAt: -1, _id: 1 })
      .skip(((page ?? 1) - 1) * 20)
      .limit(20);

    // sent empty array if there is no result found
    if (result.length == 0) return res.json({ status: true, data: [] });

    // set subCategoriesIds,doctorIds,doctorUserIds to handle search

    const subCategoriesIds = [];
    const doctorIds = [];
    const doctorUserIds = [];

    // push all id to subCategoriesIds,doctorIds,doctorUserIds
    for (const book of result) {
      if (!subCategoriesIds.includes(book.category_id))
        subCategoriesIds.push(book.category_id);
      if (!doctorIds.includes(book.doctor_id)) doctorIds.push(book.doctor_id);
      if (!doctorUserIds.includes(book.doctor_id))
        doctorUserIds.push(book.doctor_id);
    }
    // get sub category of doctor and select (_id, name_ar, name_en) by subCategoriesIds
    const categories = await sub_category_model
      .find({ _id: { $in: subCategoriesIds } })
      .select("_id name_ar name_en");
    // get doctor and select (_id, first_name, last_name) by doctorIds
    const doctors = await doctor_model.find({ user_id: { $in: doctorIds } });
    // get doctor and select (_id,first_name, last_name) by doctorUserIds
    const doctorsData = await user_model
      .find({ _id: { $in: doctorUserIds } })
      .select("_id first_name last_name");

    // get rating of user by user_rating_id and ad_id (ad_id related to favorite model)
    const ratings = await rating_model.find({
      user_rating_id: req.user.id,
      ad_id: { $in: result.map((e) => e.id) },
    });
    // get  total number of books by doctorIds
    const totalBooks = await patient_book_model.aggregate([
      {
        $match: {
          doctor_id: { $in: doctorIds },
        },
      },
      { $group: { _id: "$doctor_id", total: { $sum: 1 } } },
    ]);
//set rating to each book if book have rating
    for (const book of result) {
      for (const rating of ratings) {
        if (book.id == rating.ad_id) {
          book._doc.rating = rating;
          break;
        }
      }
//set sub_category to each book if book have sub_category
      for (const category of categories) {
        if (book.category_id == category.id) {
          book._doc.sub_category =
            language == "ar" ? category.name_ar : category.name_en;
          break;
        }
      }
      // set doctor to each book if book have doctor
      for (const doctor of doctors) {
        if (book.doctor_id == doctor.user_id) {
          book._doc.doctor_info = doctor;
          book._doc.doctor_info._doc.total = 0;
          // set total number of books to each doctor
          for (const total of totalBooks) {
            if (total._id == doctor.user_id) {
              book._doc.doctor_info._doc.total = total.total;
              break;
            }
          }
          // set name to each doctor if doctor have id in doctorsData
          for (const doctorData of doctorsData) {
            if (doctorData.id == doctor.user_id) {
              book._doc.doctor_info._doc.name = `${doctorData.first_name} ${doctorData.last_name}`;
              break;
            }
          }
          break;
        }
      }
    }

    res.json({
      status: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
};


