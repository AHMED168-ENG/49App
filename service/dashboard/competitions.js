import ConflictError from "../../utils/types-errors/conflict-error.js";
import NotFoundError from "../../utils/types-errors/not-found.js";
import BadRequestError from "../../utils/types-errors/bad-request.js";
import competition_model from "../../models/competitions/competition_model.js";

// return a new object with only the fields that are in the fields array
const filterFieldsForUpdate = (body, fields) => {
  const updateObject = {};
  fields.forEach((field) => {
    if (body[field]) updateObject[field] = body[field];
  });
  return updateObject;
};

export const createCompetitionService = async (body, headers) => {
  try {
    // -> 1) Get the language from the request headers
    const { language } = headers || "en";

    // -> 2) Extract the data from the request body
    const {
      category_id,
      name,
      description,
      pricePerRequest,
      maxSubscriber,
      withdrawLimit,
      start_date,
      end_date,
      active,
    } = body;

    // -> 3) Check if the competition name is already exists
    const competition = await competition_model.findOne({
      name,
    });

    // -> 4) If the competition name is already exists, return an error
    if (competition) {
      throw new ConflictError(
        language === "en"
          ? "Competition name is already exists"
          : "اسم المسابقة موجود بالفعل"
      );
    }

    // -> 5) Create a new competition
    const result = await competition_model.create({
      category_id,
      name,
      description,
      pricePerRequest,
      maxSubscriber,
      withdrawLimit,
      start_date,
      end_date,
      active,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

export const updateCompetitionService = async (
  body,
  competitionId,
  headers
) => {
  try {
    // -> 1) Get the language from the request headers
    const { language } = headers || "en";

    // -> 2) Get the competition by id
    const competition = await competition_model.findById(competitionId);

    // -> 3) If the competition is not exists, return an error
    if (!competition) {
      return next(
        new NotFoundError(
          language === "en" ? "Competition not found" : "المسابقة غير موجودة"
        )
      );
    }

    // -> 4) Update the competition
    const fields = [
      "name",
      "description",
      "pricePerRequest",
      "maxSubscriber",
      "withdrawLimit",
      "start_date",
      "end_date",
      "status",
    ];
    const updateObject = filterFieldsForUpdate(body, fields);

    if (updateObject.name) {
      const competition = await competition_model.findOne({
        name: updateObject.name,
      });
      if (competition) {
        throw new ConflictError(
          language === "en"
            ? "Competition name is already exists"
            : "اسم المسابقة موجود بالفعل"
        );
      }
    }

    // -> 5) Save the updated competition
    const result = await competition_model.findByIdAndUpdate(
      competitionId,
      updateObject,
      {
        new: true,
        runValidators: true,
      }
    );

    return result;
  } catch (error) {
    throw new BadRequestError(error.message);
  }
};

export const getAllCompetitionsService = async ({ pagination }) => {
  const { page, limit } = pagination;

  // -> 1) Get all competitions
  const data = await competition_model
    .find()
    .populate("category_id", "name_ar name_en")
    .skip((page - 1) * limit)
    .limit(limit);

  // -> 2) Get the count of all competitions
  const count = await competition_model.countDocuments();

  return { data, count };
};

export const getCompetitionByIdService = async (competitionId, headers) => {
  try {
    // -> 1) Get the language from the request headers
    const { language } = headers || "en";

    // -> 2) Get the competition by id
    const competition = await competition_model
      .findById(competitionId)
      .populate("category_id", "name_ar name_en");

    // -> 3) If the competition is not exists, return an error
    if (!competition) {
      return next(
        new NotFoundError(
          language === "en" ? "Competition not found" : "المسابقة غير موجودة"
        )
      );
    }

    return competition;
  } catch (error) {
    throw new BadRequestError(error.message);
  }
};
