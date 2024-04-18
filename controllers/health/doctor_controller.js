import user_model from "../../models/user_model.js";
import sub_category_model from "../../models/sub_category_model.js";
import rating_model from "../../models/rating_model.js";
import main_category_model from "../../models/main_category_model.js";
import subscription_model from "../../models/subscription_model.js";
import doctor_model from "../../models/doctor_model.js";
import patient_book_model from "../../models/patient_book_model.js";


// create new doctor controller
export const createDoctor = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers;
    // user_id extracted from token
    const { id } = req.user;
    // distribute the request body to variables
    const {
      category_id,
      specialty,
      location,
      work_from,
      work_to,
      available_day,
      examination_price,
      waiting_time,
      pictures,
    } = req.body;
    // define picture array to variables
    const picture = pictures[0];
    const id_front = pictures[1];
    const id_behind = pictures[2];
    const practice_license_front = pictures[3];
    const practice_license_behind = pictures[4];
    // check if user exists or not
    const user = await user_model.findById(id).select("_id country_code");
    // send error if user not found
    if (!user)
      return next({
        status: 400,
        message:
          language == "ar" ? "المستخدم غير موجود" : "The User is Not Exist",
      });

    // check if user registered as doctor or not
    const doctor = await doctor_model.findOne({ user_id: id });

    // send error if user already registered
    if (doctor)
      return next({
        status: 400,
        message:
          language == "ar"
            ? "لقد قمت بالتسجيل من قبل"
            : "You already Registered Before",
      });

  
    //  check if user is premium subscribed or not
    const subscription = await subscription_model.findOne({
      user_id: id,
      sub_category_id: category_id,
      is_premium: true,
    });

    // create new doctor model
    const newDoctor = new doctor_model({
      user_id: id,
      picture,
      id_front,
      id_behind,
      practice_license_front,
      practice_license_behind,
      category_id,
      location,
      work_from,
      work_to,
      available_day: available_day.map((e) => parseInt(e)),
      country_code: user.country_code,
      examination_price,
      waiting_time,
      specialty,
      is_premium: subscription != null,
    });
    // save doctor model to database
    await newDoctor.save();

    // update user as doctor
    await user_model.updateOne({ _id: id }, { is_doctor: true }).exec();

    res.json({
      status: true,
    });
  } catch (e) {
    next(e);
  }
};
// get doctor controller
// delete doctor controller
export const deleteDoctor = async (req, res, next) => {
  // extract user id from token
  const { id } = req.user;
  try {
    // find doctor by user id and delete it from database.
    const DeletedDoctor = await doctor_model.findOneAndDelete({
      user_id: id,
    });

    // check if doctor is deleted or not and delete all related data after deletion.
    if (DeletedDoctor) {
      await Promise.all([
        patient_book_model.deleteMany({ doctor_id: id }),
        rating_model.deleteMany({
          user_id: id,
          category_id: DeletedDoctor.category_id,
        }),

        // update user is_doctor to false
        await user_model.updateOne({ _id: id }, { is_doctor: false }),
      ]);
    }
    res.json({
      status: true,
    });
  } catch (e) {
    next(e);
  }
};

//update doctor controller
export const updateDoctor = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers;

    const {
      work_from,
      work_to,
      available_day,
      waiting_time,
      examination_price,
    } = req.body;
    // check if doctor exist or not and update doctor model with new data
    const doctor = await doctor_model.findOneAndUpdate(
      {
        user_id: req.user.id,
        is_approved: true,
        is_active: true,
      },
      {
        work_from,
        work_to,
        available_day: available_day.map((e) => parseInt(e)),
        waiting_time,
        examination_price,
      },
      { returnOriginal: false }
    );

    // send error if doctor not found
    if (!doctor) return next({ status: 404, message: "Doctor Not Found" });

    // get doctor subcategory and  reset data in subcategory model.
    const category = await sub_category_model.findById(doctor.category_id);
    // set from dashboard.
    doctor._doc.total = 0;
    category._doc.total = 0;
    category._doc.is_favorite = false;

    if (language == "ar") {
      category._doc.name = category.name_ar;
    } else {
      category._doc.name = category.name_en;
    }

    delete category._doc.name_ar;
    delete category._doc.name_en;
    // set doctor category after rest data.
    doctor._doc.category = category;

    res.json({
      status: true,
      data: doctor,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

// Update doctor picture controller
export const updateDocPicture = async (req, res, next) => {
  try {
    // extract path from body
    const { path } = req.body;
    const { id } = req.user;
    // check if path is empty or not
    if (!path) return next("check your data again,path is required");
    // if path is not empty then update doctor picture with new data.
    await doctor_model.updateOne(
      {
        user_id: id,
        is_approved: true,
        is_active: true,
      },
      { picture: path }
    );

    res.json({
      status: true,
    });
  } catch (e) {
    next(e);
  }
};
// get doctor by id
export const getDoctorById = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers;

    const doctorId = req.params.id;

    // check if doctor exist or not
    const doctor = await doctor_model
      .findById(doctorId)
      .select(
        "_id category_id category_id user_id location specialty work_from work_to available_day rating examination_price waiting_time createdAt"
      );
    // if not exist send error
    if (!doctor)
      return next({
        status: 404,
        message:
          language == "ar" ? "الدكتور غير موجود" : "The Doctor is Not Exist",
      });
    // get doctor subcategory.
    const subCategory = await sub_category_model
      .findById(doctor.category_id)
      .select("name_ar name_en parent");
    // if sub category not found send error
    if (!subCategory) return next("sub category not found");
    // get doctor main category.
    const mainCategory = await main_category_model
      .findById(subCategory.parent)
      .select("name_ar name_en");
    // if main category not found send error
    if (!mainCategory) return next(" main category not found");
    // get doctor subscriptions and return array of user_id by distinct(user_id)
    const subscriptions = await subscription_model

      // replace req.params.categoryId with  doctor.category_id
      .find({
        sub_category_id: req.params.categoryId,
        user_id: { $in: [req.user.id, doctor.user_id] },
      })
      .distinct("user_id");

    // get doctor total book  of patient
    const totalBook = await patient_book_model.aggregate([
      {
        $match: {
          doctor_id: doctor.user_id,
        },
      },
      { $group: { _id: "$doctor_id", total: { $sum: 1 } } },
    ]);
    // get doctor data and return (doctor_id,first_name,last_name)
    const doctorData = await user_model
      .findById(doctor.user_id)
      .select("_id first_name last_name");

    const now = new Date();

    // check if doctor is opened or not
    doctor._doc.is_opened =
      doctor.available_day.includes(now.getDay()) &&
      now.getHours() >= doctor.work_from &&
      now.getHours() <= doctor.work_to;
    // check if doctor is subscribed or not
    doctor._doc.is_subscription =
      subscriptions.includes(doctor.user_id) ||
      subscriptions.includes(req.user.id);
   // set doctor main category and sub category name
    doctor._doc.main_category_name =
      language == "ar" ? mainCategory.name_ar : mainCategory.name_en;
    doctor._doc.sub_category_name =
      language == "ar" ? subCategory.name_ar : subCategory.name_en;

    doctor._doc.name = "";
    // check if doctor data exist and set doctor name
    if (doctorData) {
      doctor._doc.name = `${doctorData.first_name} ${doctorData.last_name}`;
    }

    doctor._doc.total = 0;

    if (totalBook.length > 0) {
      doctor._doc.total = totalBook[0].total;
    }

    res.json({
      status: true,
      data: doctor,
    });
  } catch (e) {
    next(e);
  }
};



// get doctor by category
export const getDoctorsByCategory =async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
// extract page from query
    const { page } = req.query
  // check if user exist or not and get user country_code
    const user = await user_model.findById(req.user.id).select('country_code')
// if user not exist send error
    if (!user) return next('user not found');
 // get category by id and return (name_ar,name_en, parent) of category
    const subCategory = await sub_category_model
      .findById(req.params.categoryId)
      .select('name_ar name_en parent')
// if sub category not found send error.
    if (!subCategory) return next('Bad Request')
// get main category by parent and return (name_ar,name_en).
    const mainCategory = await main_category_model
      .findById(subCategory.parent)
      .select('name_ar name_en')
// if main category not found send error.
    if (!mainCategory) return next('main category not found');

    //get doctors by user country_code and sort by createdAt 
    const doctors = await doctor_model
      .find({
        country_code: user.country_code,
        category_id: req.params.categoryId,
        is_active: true,
        is_approved: true
      })
      .select(
        '_id category_id category_id user_id location specialty work_from work_to available_day rating examination_price waiting_time createdAt'
      )
      .sort({ createdAt: -1, _id: 1 })
      .skip(((page ?? 1) - 1) * 20)
      .limit(20)

    const usersIds = [req.user.id]
   // push doctor user_id in usersIds array.
    doctors.forEach(d => {
      if (!usersIds.includes(d.user_id)) usersIds.push(d.user_id)
      delete d._doc.calls
    })

    // get doctor data and return (doctor_id,first_name,last_name)
    const doctorsData = await user_model
      .find({ _id: { $in: usersIds } })
      .select('_id first_name last_name profile_picture')
 // get doctor subscriptions and return array of user_id by distinct(user_id)
    const subscriptions = await subscription_model
      .find({
        sub_category_id: req.params.categoryId,
        user_id: { $in: usersIds }
      })
      .distinct('user_id')
// get doctor total book  of patient
    const totalBook = await patient_book_model.aggregate([
      {
        $match: {
          doctor_id: { $in: usersIds }
        }
      },
      { $group: { _id: '$doctor_id', total: { $sum: 1 } } }
    ])

    const now = new Date()
 // check if doctor is opened or not and subscribe or not
    doctors.forEach(item => {
      item._doc.is_opened =
        item.available_day.includes(now.getDay()) &&
        now.getHours() >= item.work_from &&
        now.getHours() <= item.work_to
      item._doc.is_subscription =
        subscriptions.includes(item.user_id) ||
        subscriptions.includes(req.user.id)

      item._doc.main_category_name =
        language == 'ar' ? mainCategory.name_ar : mainCategory.name_en
      item._doc.sub_category_name =
        language == 'ar' ? subCategory.name_ar : subCategory.name_en

      item._doc.name = ''

      for (const user of doctorsData) {
        if (user.id == item.user_id) {
          item._doc.name = `${user.first_name} ${user.last_name}`
          item._doc.picture = user.profile_picture
          break
        }
      }

      // set doctor total book of patient.
      item._doc.total = 0
      for (const total of totalBook) {
        if (total._id == item.user_id) {
          item._doc.total = total.total
          break
        }
      }
    })

    res.json({
      status: true,
      data: doctors
    })
  } catch (e) {
    console.log(e)
    next(e)
  }
}  



















