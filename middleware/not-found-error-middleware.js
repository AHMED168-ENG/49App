import NotFoundError from "../utils/types-errors/not-found.js";

const notFoundErrorMiddleware = (req, res, next) => {
  next(
    new NotFoundError(
      "Ooh you are lost, read the the API documentations to find your way back home 😂"
    )
  );
};

export { notFoundErrorMiddleware };
