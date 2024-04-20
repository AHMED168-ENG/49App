import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { buildError } from "../utils/buildError.js";
import bcrypt from "bcrypt";
import user_model from "../models/user_model.js";
import auth_model from "../models/auth_model.js";
import { generateOtp } from "../utils/generateOtp.js";
import app_manager_model from "../models/app_manager_model.js";
import { SendMails } from "../gmail/mail.js";
import { errorWithLanguages } from "../utils/errorWithLanguages.js";
import wallet_model from "../models/wallet_model.js";
import { comparePlainTextToHash } from "../utils/compare-plain-text-to-hash.js";
import { comparePasswordToHash } from "../utils/compare-password-to-hash.js";
import { plainTextToHash } from "../utils/plain-text-to-hash.js";
import { passwordToHash } from "../utils/password-to-hash.js";
import { sendAnyEmail } from "../gmail/send_email.js";
import { randomBytes } from "crypto";
import { verifyToken } from "../utils/verify-token.js";

const playStoreLink =
  "https://play.google.com/store/apps/details?id=com.fourtyninehub.fourtynine";
const appleStoreLink = "https://apps.apple.com/us/app/49-app/id1632305652";

export const registerController = async ({ body }, res, next) => {
  try {
    // --> 1) check if email exists in DB
    const isUserExists = await user_model
      .findOne({
        email: body.email,
      })
      .select("_id");

    if (isUserExists) {
      return res.status(httpStatus.CONFLICT).json({
        message: "Email already exists",
        success: false,
      });
    }

    // --> 3) password to hash
    const hashedPassword = await passwordToHash(body.password);

    // --> 4) inset new user
    const { password, ...dataInserted } = body;
    const { email, first_name, last_name } = body;

    const user = await user_model.create({
      ...dataInserted,
      password: hashedPassword,
    });

    // --> 5) generate OTP
    const otp = generateOtp(6);

    // --> 6) hash OTP
    const hashedOtp = await plainTextToHash(
      otp,
      randomBytes(16).toString("hex")
    );

    // --> 7) insert otp
    await user_model.updateOne({ _id: user._id }, { otp: hashedOtp });

    try {
      // --> 8) create wallet
      await wallet_model.create({ user_id: user._id });

      // --> 9) send email with OTP
      await sendAnyEmail({
        otp,
        email,
        fName: first_name,
        lName: last_name,
        subject: "Verify Your Email Registration on 49App",
        body: "To complete your registration and unlock the full potential of 49App, please take a moment to verify your email address",
      });
    } catch (error) {
      // --> delete user if don't send email
      await user_model.deleteOne({ email: body.email });
      throw error;
    }

    // --> 10) return response to client
    return res.status(httpStatus.CREATED).json({
      message: "OTP sent to your email",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailController = async ({ body }, res, next) => {
  try {
    // --> 1) get data from body
    const { email, otp } = body;

    // --> 2) check if email exists in DB
    const isUserExists = await user_model.findOne({ email });

    if (!isUserExists) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Email is invalid",
        success: false,
      });
    }

    // --> 3) check if this user have otp in database
    if (!isUserExists.otp) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "OTP is invalid",
        success: false,
      });
    }

    // --> 4) check if hashed otp is correct
    const isOtpCorrect = await comparePlainTextToHash(otp, isUserExists.otp);

    if (!isOtpCorrect) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "OTP is invalid",
        success: false,
      });
    }

    // --> 5) update isEmailVerified to true and delete otp
    await user_model.updateOne({ email }, { isEmailVerified: true, otp: null });

    return res.status(httpStatus.OK).json({
      message: "Email verified successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async ({ body }, res, next) => {
  try {
    // --> 1) get data from body
    const { email, password, keepLogin } = body;

    // --> 2) check if email exists
    const isUserExists = await user_model
      .findOne({ email })
      .select("_id password isEmailVerified is_locked");

    if (!isUserExists) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Email or password incorrect",
        success: false,
      });
    }

    // --> 3) check if password is correct
    const isPasswordCorrect = await comparePasswordToHash(
      password,
      isUserExists.password
    );

    if (!isPasswordCorrect) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Email or password incorrect",
        success: false,
      });
    }

    // --> 4) check if email verified
    if (!isUserExists.isEmailVerified) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message:
          "Your email has not been confirmed yet. You cannot login until you confirm your email",
        success: false,
      });
    }

    // --> 5) check if user locked
    if (isUserExists.is_locked) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Your account has been locked. Please contact support",
        success: false,
      });
    }

    // --> 6) generate access token
    const accessToken = jwt.sign({}, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.EXPIRED_ACCESS_TOKEN,
      subject: isUserExists._id.toString(),
    });

    // --> 7) generate refresh token
    const refreshToken = jwt.sign({}, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.EXPIRED_REFRESH_TOKEN,
      subject: isUserExists._id.toString(),
    });

    // --> 8) return response to client
    res.status(httpStatus.OK).json({
      message: "Login successfully",
      success: true,
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenController = async ({ body }, res, next) => {
  try {
    // --> 1) get refresh token form body
    const { refreshToken } = body;

    // --> 1) check if refresh token verify (no change happens, expired token)
    const decoded = await verifyToken(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // --> 2) check if user not delete account after create refresh token
    const isUserExists = await user_model.findById(decoded.sub);

    if (!isUserExists) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
        success: false,
      });
    }

    // --> 3) generate token access token
    const accessToken = jwt.sign({}, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.EXPIRED_ACCESS_TOKEN,
      subject: isUserExists._id.toString(),
    });

    // --> 4) return response to client
    res.status(httpStatus.OK).json({
      message: "Refresh token successfully",
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * login organization operation
 * @deprecated This function is deprecated from refactor ver. 0.1 Use loginController
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, keepLogin } = req.body;
    const user = await user_model.findOne({ email: email });
    if (user && bcrypt.compareSync(password, user.password)) {
      if (user?.is_locked)
        throw buildError(
          httpStatus.FORBIDDEN,
          errorWithLanguages({
            en: "your account not active check your email or call organization admin",
            ar: "حسابك غير نشط، تحقق من بريدك الإلكتروني أو اتصل بمسؤول المؤسسة",
          })
        );
      let token = generateToken(user, keepLogin, "9999999d");
      return res.status(httpStatus.OK).json({
        status: true,
        data: {
          user,
          token,
        },
      });
    } else {
      return res.status(httpStatus.FORBIDDEN).json({
        message: "you not allowed to enter wrong password",
        status: false,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * generate token operation
 */
const generateToken = (user, keepLogin, expirationDate) => {
  return jwt.sign(
    {
      id: user._id,
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      email: user.email,
    },
    process.env.SECRET_KEY,
    { expiresIn: keepLogin ? "9999 years" : expirationDate }
  );
};

const generateTokenForResetPassword = (user, expirationDate) => {
  return jwt.sign(user, process.env.SECRET_KEY, { expiresIn: expirationDate });
};

/** ------------------------------------------------------  
 * @desc forget user password
 * @route /auth
 * @method post
 * @access private forget user password
 /**  ------------------------------------------------------  */
export const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await user_model.findOne({ email });
    let otp = generateOtp(5);
    SendMails({
      email: user.email,
      fName: user.first_name,
      lName: user.last_name,
      subject: "Reset You Password 😇",
      otp,
    });
    await user_model.updateOne(
      {
        _id: user.id,
      },
      { otp: otp, passwordResetExpiration: Date.now() + 60 * 60 * 1000 }
    );
    return res.status(httpStatus.OK).send({ status: true });
  } catch (error) {
    next(error);
  }
};

/** ------------------------------------------------------  
 * @desc check verify token 
 * @route /auth
 * @method post
 * @access private check verify token 
 /**  ------------------------------------------------------  */
export const checkOtp = async (req, res, next) => {
  try {
    const { otp, email } = req.body;
    let user = await user_model.findOne({ email, otp });
    if (!user) throw buildError(httpStatus.FORBIDDEN, "wrong otp");
    if (user && user.passwordResetExpiration < Date.now())
      throw buildError(
        httpStatus.FORBIDDEN,
        errorWithLanguages({
          en: "your otp is expired",
          ar: "لقد انتهت صلاحية كلمة المرور الخاصة بك",
        })
      );
    const token = generateTokenForResetPassword({ otp }, 10 * 60 * 1000);

    return res.status(httpStatus.OK).send({ success: true, token });
  } catch (error) {
    next(error);
  }
};

/** ------------------------------------------------------  
 * @desc reset user password 
 * @route /auth
 * @method post
 * @access private forget user password 
 /**  ------------------------------------------------------  */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token } = req.query;
    let decodedToken = null;
    try {
      decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
      if (error?.name == "TokenExpiredError") {
        return res.status(httpStatus.UNAUTHORIZED).json({
          message: "your token is expired go back and do process again",
          success: false,
        });
      }
    }
    let user = await user_model.findOne({
      email: email,
      otp: decodedToken.otp,
    });
    if (!user)
      throw buildError(
        httpStatus.FORBIDDEN,
        errorWithLanguages({
          en: "wrong otp",
          ar: "كلمة المرور خاطئة",
        })
      );
    user = await user_model.findOneAndUpdate(
      { email },
      {
        passwordResetExpiration: null,
        otp: null,
        passwordChangeAt: Date.now(),
        password: bcrypt.hashSync(password, 12),
      },
      { new: true, projection: { password: 0 } }
    );
    SendMails({
      email: user.email,
      fName: user.first_name,
      lName: user.last_name,
      subject: "your password reset successful ",
    });
    return res.status(httpStatus.OK).send({ status: true, data: data });
  } catch (error) {
    next(error);
  }
};

export const welcomeGift = async (req, res, next) => {
  try {
    const appManager = await app_manager_model
      .findOne({})
      .select("welcome_gift");

    res.json({ gift: appManager.welcome_gift });
  } catch (e) {
    next(e);
  }
};

export const refererGift = async (req, res, next) => {
  try {
    const appManager = await app_manager_model
      .findOne({})
      .select("referral_gift welcome_gift");

    delete appManager._doc._id;

    appManager._doc.apple_store_link = appleStoreLink;
    appManager._doc.play_store_link = playStoreLink;

    res.json(appManager);
  } catch (e) {
    next(e);
  }
};

/**
 * @deprecated This function is deprecated from refactor ver. 0.1 Use registerController
 */
export const register = async (req, res, next) => {
  try {
    var hashCode = Math.floor(Math.random() * 9000000000000);
    const body = req.body;
    const isExisted = await user_model.findOne({
      email: body.email,
    });

    if (isExisted)
      throw buildError(
        httpStatus.FORBIDDEN,
        errorWithLanguages({
          en: "there is email account already existed",
          ar: "هذا الايميل مسجل بالفعل",
        })
      );
    let user = await user_model.create({
      ...body,
      password: bcrypt.hashSync(body.password, 12),
      hash_code: hashCode,
    });
    let token = generateToken(user, body.keepLogin, "30d");

    let auth = await auth_model.create({
      fcm: body.fcm,
      user_id: user.id,
      device_id: body.device_id,
    });
    const wallet = await wallet_model.findOne({ user_id: user.id });
    if (!wallet) {
      await wallet_model.create({
        user_id: user.id,
      });
    }

    SendMails({
      email: body.email,
      fName: body.first_name,
      lName: body.last_name,
      subject: "welcome in 49App as user account",
    });
    return res.status(httpStatus.CREATED).json({
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const socialLogin = async (req, res, next) => {
  try {
    const { language } = req.headers;

    const { idToken, fcm, device_id, currency, country_code } = req.body;

    if (!idToken || !device_id) return next("Bad Request");

    const firebaseUser = await firebase_admin.auth().verifyIdToken(idToken);

    if (firebaseUser) {
      const { name, picture, uid, email, phone } = firebaseUser;

      const provider = firebaseUser.firebase.sign_in_provider;

      const existUser = await user_model
        .findOne({ provider, email })
        .select(fullUserKeys);

      if (!existUser) {
        var hashCode = Math.floor(Math.random() * 9000000000000);
        while (
          await user_model.findOne({ hash_code: hashCode }).select("_id")
        ) {
          hashCode = Math.floor(Math.random() * 9000000000000);
        }

        const userObject = new user_model({
          first_name: name,
          last_name: " ",
          phone,
          profile_picture: picture,
          provider,
          email,
          uid,
          hash_code: hashCode,
          currency,
          country_code,
        });

        const user = await userObject.save();

        const appManager = await app_manager_model
          .findOne({})
          .select("welcome_gift free_click_gift");

        const auth = await auth_model.findOneAndUpdate(
          { device_id },
          { user_id: user.id, fcm },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        const walletObject = new wallet_model({
          user_id: user._id,
          balance: appManager.welcome_gift,
          refund_storage: -appManager.welcome_gift,
          referral_cash_back: user.referral_id ? appManager.referral_gift : 0,
          free_click_storage: appManager.free_click_gift,
        });

        await walletObject.save();
        const notification = new notification_model({
          receiver_id: user._id,
          text_en: `Thank you for registering with us, You have got ${appManager.welcome_gift} EGP as a welcome from 49 App.`,
          text_ar: ` شكرا جزيلا للتسجيل معنا, لقد حصلت على ${appManager.welcome_gift} جنية كهدية من تطبيق 49`,
          tab: 3,
        });

        notification.save();
        sendNotification(
          fcm,
          user.language == "ar"
            ? `${user.first_name} ${user.last_name} اهلا`
            : `Hi ${user.first_name} ${user.last_name}`,
          user.language == "ar"
            ? ` شكرا جزيلا للتسجيل معنا, لقد حصلت على ${appManager.welcome_gift} جنية كهدية من تطبيق 49`
            : `Thank you for registering with us, You have got ${appManager.welcome_gift} EGP as a welcome from 49 App.`
        );
        return res.json({
          status: true,
          data: {
            ...getUserData(user),
            token: createToken(
              user.id,
              auth.id,
              auth._doc.updatedAt,
              false,
              false
            ),
          },
        });
      } else {
        const auth = await auth_model.findOneAndUpdate(
          { device_id },
          { user_id: existUser.id, fcm },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.json({
          status: true,
          data: {
            ...getUserData(existUser),
            token: createToken(
              existUser.id,
              auth.id,
              auth._doc.updatedAt,
              false,
              false
            ),
          },
        });
      }
    }
    return next(language == "ar" ? "حدث خطأ ما" : "There is an Error");
  } catch (e) {
    next(e);
  }
};
