import user_model from '../../models/user_model.js'
import sub_category_model from '../../models/sub_category_model.js'
import rating_model from '../../models/rating_model.js'
import main_category_model from '../../models/main_category_model.js'
import subscription_model from '../../models/subscription_model.js'
import doctor_model from '../../models/doctor_model.js'
import patient_book_model from '../../models/patient_book_model.js'

// create new doctor controller   65 line to 45
export const createDoctor = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    // user_id extracted from token
    const { id } = req.user
    // distribute the request body to variables
    const { pictures, available_day, ...allData } = req.body
    const [
      picture,
      id_front,
      id_behind,
      practice_license_front,
      practice_license_behind
    ] = pictures
    // check if user exists or not  => try to validate in v-file
    const user = await user_model.findById(id).select('_id country_code')
    // check if user registered as doctor or not
    const doctor = await doctor_model.findOne({ user_id: id })
    //  check if user is premium subscribed or not
    const subscription = await subscription_model.findOne({
      user_id: id,
      sub_category_id: req.body.category_id,
      is_premium: true
    })
    // create new doctor model
    await doctor_model.create({
      ...allData,
      user_id: id,
      picture,
      id_front,
      id_behind,
      practice_license_front,
      practice_license_behind,
      available_day: available_day.map(e => parseInt(e)),
      country_code: user.country_code,
      is_premium: subscription != null
    })
    // update user as doctor
    await user_model.updateOne({ _id: id }, { is_doctor: true }).exec()
    res.json({
      status: true
    })
  } catch (e) {
    next(e)
  }
}

// get doctor controller
// delete doctor controller
export const deleteDoctor = async (req, res, next) => {
  // extract user id from token
  const { id } = req.user
  try {
    // find doctor by user id and delete it from database.
    const DeletedDoctor = await doctor_model.findOneAndDelete({
      user_id: id
    })

    // check if doctor is deleted or not and delete all related data after deletion.
    if (DeletedDoctor) {
      await Promise.all([
        patient_book_model.deleteMany({ doctor_id: id }),
        rating_model.deleteMany({
          user_id: id,
          category_id: DeletedDoctor.category_id
        }),

        // update user is_doctor to false
        await user_model.updateOne({ _id: id }, { is_doctor: false })
      ])
    }
    res.json({
      status: true,
    })
  } catch (e) {
    next(e)
  }
}

//update doctor controller
export const updateDoctor = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    const { available_day, ...allData } = req.body
    // check if doctor exist or not and update doctor model with new data
    const doctor = await doctor_model.findOneAndUpdate(
      {
        user_id: req.user.id,
        is_approved: true,
        is_active: true
      },
      {
        ...allData,
        available_day: available_day.map(e => parseInt(e))
      },
      { returnOriginal: false }
    )

    // get doctor subcategory and  reset data in subcategory model.
    const category = await sub_category_model.findById(doctor.category_id)

    // set from dashboard.
    doctor._doc.total = 0
    category._doc.total = 0
    category._doc.is_favorite = false

    if (language == 'ar') {
      category._doc.name = category.name_ar
    } else {
      category._doc.name = category.name_en
    }
    // delete name_ar and name_en from category to do not show in the main search.
    delete category._doc.name_ar
    delete category._doc.name_en
    // set doctor category after rest delete name_ar and name_en from category.
    doctor._doc.category = category

    res.json({
      status: true
    })
  } catch (e) {
  
    next(e)
  }
}

// Update doctor picture controller
export const updateDocPicture = async (req, res, next) => {
  try {
    // extract path from body
    const { path } = req.body
    const { id } = req.user
    // if path is not empty then update doctor picture with new data.
    await doctor_model.updateOne(
      {
        user_id: id,
        is_approved: true,
        is_active: true
      },
      { picture: path }
    )
    res.json({
      status: true
    })
  } catch (e) {
    next(e)
  }
}
// get doctor by id
export const getDoctorById = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    const doctorId = req.params.id
    const { id } = req.user
    // check if doctor exist or not
    const doctor = await doctor_model
      .findById(doctorId)
      .select(
        '_id category_id  user_id location specialty work_from work_to available_day rating examination_price waiting_time createdAt'
      )
    const { mainCategory } = await getMainCategoryAndSubCategory(
      doctor.category_id
    )
    // get doctor subscriptions and return array of user_id by distinct(user_id)
    const subscriptions = await subscription_model
      // replace req.params.categoryId with  doctor.category_id
      .find({
        sub_category_id: req.params.categoryId,
        user_id: { $in: [req.user.id, doctor.user_id] }
      })
      .distinct('user_id')
    // get doctor total book  of patient
    const totalBook = await getTotalBookById(doctor)
    // get doctor data and return (doctor_id,first_name,last_name)
    const doctorData = await user_model
      .findById(doctor.user_id)
      .select('_id first_name last_name')
    // check if doctor is opened or not
    checkDoctorOpenAndSubscribe(
      doctor,
      subscriptions,
      mainCategory,
      language,
      id
    )
    // check if doctor data exist and set doctor name
    if (doctorData) {
      doctor._doc.name = `${doctorData.first_name} ${doctorData.last_name}`
    }
    doctor._doc.total = 0
    if (totalBook.length > 0) {
      doctor._doc.total = totalBook[0].total
    }
    res.json({
      status: true,
      data: doctor
    })
  } catch (e) {
    next(e)
  }
}

// get doctor by category
export const getDoctorsByCategory = async (req, res, next) => {
  try {
    // extract language from headers
    const { language } = req.headers
    // extract page from query
    const { page } = req.query
    // extract category id from params
    const { categoryId } = req.params
    // check if user exist or not and get user country_code
    const user = await user_model.findById(req.user.id).select('country_code')
    // get sub category and main category by category id
    const { mainCategory } = await getMainCategoryAndSubCategory(categoryId)
    //get doctors by user country_code and sort by createdAt
    const { doctors } = await getDoctors(user, categoryId, page)
    // set usersIds array with doctors user_id
    const usersIds = [req.user.id]
    // push doctor user_id in usersIds array.
    doctors.forEach(d => {
      if (!usersIds.includes(d.user_id)) usersIds.push(d.user_id)
      delete d._doc.calls
    })
    // get doctor data and return (doctor_id,first_name,last_name)
    const doctorsData = await getDoctorsData(usersIds)
    // get doctor subscriptions and return array of user_id by distinct(user_id)
    const subscriptions = await getSubscription(categoryId, usersIds)
    // get doctor total book  of patient
    const totalBook = await getTotalBookByCat(usersIds)
    // check if doctor is opened or not and subscribe or not
    doctors.forEach(item => {
      // check if doctor is opened or not and subscribe or not
      checkDoctorOpenAndSubscribe(
        item,
        subscriptions,
        mainCategory,
        language,
        req.user.id
      )
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

    next(e)
  }
}

/*helper functions of doctor controller */
// get main category and sub category
const getMainCategoryAndSubCategory = async categoryId => {
  const subCategory = await sub_category_model
    .findById(categoryId)
    .select('name_ar name_en parent')

  // get doctor main category.
  const mainCategory = await main_category_model
    .findById(subCategory.parent)
    .select('name_ar name_en')
  return {
    subCategory,
    mainCategory
  }
}
// get doctors by user country_code and sort by createdAt
const getDoctors = async (user, categoryId, page) => {
  const doctors = await doctor_model
    .find({
      country_code: user.country_code,
      category_id: categoryId,
      is_active: true,
      is_approved: true
    })
    .select(
      '_id category_id  user_id location specialty work_from work_to available_day rating examination_price waiting_time createdAt'
    )
    .sort({ createdAt: -1, _id: 1 })
    .skip(((page ?? 1) - 1) * 20)
    .limit(20)

  return {
    doctors
  }
}
// get doctors data and return (doctor_id,first_name,last_name)
const getDoctorsData = async usersIds => {
  return await user_model
    .find({ _id: { $in: usersIds } })
    .select('_id first_name last_name profile_picture')
}
// get subscription
const getSubscription = async (categoryId, usersIds) => {
  return await subscription_model
    .find({
      sub_category_id: categoryId,
      user_id: { $in: usersIds }
    })
    .distinct('user_id')
}
// get total book of patient
const getTotalBookById = async doctor => {
  return await patient_book_model.aggregate([
    {
      $match: {
        doctor_id: doctor.user_id
      }
    },
    { $group: { _id: '$doctor_id', total: { $sum: 1 } } }
  ])
}
// get total book of patient by usersIds
const getTotalBookByCat = async usersIds => {
  return await patient_book_model.aggregate([
    {
      $match: {
        doctor_id: { $in: usersIds }
      }
    },
    { $group: { _id: '$doctor_id', total: { $sum: 1 } } }
  ])
}
// check doctor open, subscribe and  set doctor name
const checkDoctorOpenAndSubscribe = async (
  doctor,
  subscriptions,
  mainCategory,
  subCategory,
  language,
  id
) => {
  const now = new Date()
  doctor._doc.is_opened =
    doctor.available_day.includes(now.getDay()) &&
    now.getHours() >= doctor.work_from &&
    now.getHours() <= doctor.work_to
  // check if doctor is subscribed or not
  doctor._doc.is_subscription =
    subscriptions.includes(doctor.user_id) || subscriptions.includes(id)
  // set doctor main category and sub category name
  doctor._doc.main_category_name =
    language == 'ar' ? mainCategory.name_ar : mainCategory.name_en
  doctor._doc.sub_category_name =
    language == 'ar' ? subCategory.name_ar : subCategory.name_en

  doctor._doc.name = ''
}
