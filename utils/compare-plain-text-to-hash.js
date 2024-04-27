import { promisify } from "util";
import { pbkdf2 } from "crypto";

const comparePlainTextToHash = async (plainText, hash) => {
  const pk2 = promisify(pbkdf2);

  const [salt, key] = hash.split(".");

  const derivedKey = await pk2(plainText, salt, 100000, 64, "sha512").catch(
    (error) => {
      throw error;
    }
  );

  return key === derivedKey.toString("hex");
};

export { comparePlainTextToHash };
