import asyncWrapper from "../../utils/asyncWrapper.js";
import {
  createCompetitionService,
  getAllCompetitionsService,
  getCompetitionByIdService,
  updateCompetitionService,
} from "../../service/dashboard/competitions.js";

/**
 * @desc create new competition by super admin
 * @route /dashboard/competitions
 * @method post
 * @access private
 * @data {name, category_id, price_per_request, max_subscribers, start_date, end_date, active}
 * @return {status, data}
 */
export const createCompetitionController = asyncWrapper(
  async (req, res, next) => {
    // -> 1) Create a new competition
    const result = await createCompetitionService(req.body , req.headers);

    // -> 2) Send the response
    return res.status(201).json({
      status: true,
      data: result,
    });
  }
);

/**
 * @desc update competition by id by super admin
 * @route /dashboard/competitions/:competitionId
 * @method put
 * @access private
 * @data {competition_name, category_id, price_per_request, max_subscribers, start_date, end_date, active}
 * @return {status, data}
 */
export const updateCompetitionController = asyncWrapper(
  async (req, res, next) => {
    console.log(req.body);
    // -> 1) Get the competition id from the request params
    const { competitionId } = req.params;

    // -> 2) Update the competition
    const result = await updateCompetitionService(req.body, competitionId , req.headers);

    // -> 4) Send the response
    return res.status(200).json({
      status: true,
      data: result,
    });
  }
);

/**
 * @desc get all competitions by super admin active and inactive
 * @route /competitions
 * @method get
 * @access private
 * @query  page , limit
 * @return {status, data}
 */
export const getCompetitionsController = asyncWrapper(
  async (req, res, next) => {
    // -> 1) Get the language from the request headers
    const { language } = req.headers || "en";

    // -> 2) Get the query string from the request
    const { page, limit } = req.query;

    // -> 3) Get all competitions
    const result = await getAllCompetitionsService({
      pagination: {
        page: page ? parseInt(page) : process.env.PAGINATION_PAGE,
        limit: limit ? parseInt(limit) : process.env.PAGINATION_LIMIT,
      },
    });
    // -> 5) Send the response
    return res.status(200).json({
      status: true,
      data: {
        competitions: result.data,
        count: result.count,
      },
    });
  }
);

export const getCompetitionByIdController = asyncWrapper(
  async (req, res, next) => {
    // -> 1) Get the language from the request headers
    const { language } = req.headers || "en";

    // -> 2) Get the competition id from the request params
    const { competitionId } = req.params;

    // -> 3) Get the competition by id
    const result = await getCompetitionByIdService(competitionId , req.headers);

    // -> 5) Send the response
    return res.status(200).json({
      status: true,
      data: result,
    });
  }
);
