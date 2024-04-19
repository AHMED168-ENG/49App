import { verifyToken } from "../utils/verify-token.js";
import httpStatus from "http-status";
import user_model from "../models/user_model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    // --> 1) check the authorization header is not empty & start with { Bearer }
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
        success: false,
      });
    }

    // --> 2) check if token in header
    const [, accessToken] = authHeader.split(" ");

    if (!accessToken) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
        success: false,
      });
    }

    // --> 3) verify token (no change happens, expired token)
    const decoded = await verifyToken(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    // --> 4) check if the user has not deleted their account after generating the token
    const isUserExists = await user_model.findById(decoded.sub);

    if (!isUserExists) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Sorry, This user no longer exists",
        success: false,
      });
    }

    // --> 6) check that the password has not changed after creating the token
    if (isUserExists.passwordChangeAt !== null) {
      // --> 6.1) convert time to timestamp
      const passwordChangedAtTimestamp = parseInt(
        String(passwordChangeAt.getTime() / 1000),
        100
      );

      if (passwordChangedAtTimestamp > decoded.iat) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          message:
            "Sorry, user recently changed his password. please login again",
          success: false,
        });
      }
    }

    // --> 7) check if user is blocked
    if (isUserExists.is_locked) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Sorry, This user is blocked",
        success: false,
      });
    }

    // --> 8) add user in response
    req.user = {
      id: decoded.sub,
      email: isUserExists.email,
      role: isUserExists.role,
    };

    // --> 9) next
    next();
  } catch (error) {
    if (error.name == "TokenExpiredError") {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "token expired",
        success: false,
      });
    }

    if (error.name == "JsonWebTokenError") {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "invalid token",
        success: false,
      });
    }
  }
};
