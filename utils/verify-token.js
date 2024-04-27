import jwt from "jsonwebtoken";

const verifyToken = async (token, secretToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretToken, (error, decoded) => {
      if (error) {
        return reject(error);
      }

      resolve(decoded);
    });
  });
};

export { verifyToken };
