import { promisify } from "util";
import { pbkdf2 } from "crypto";

const plainTextToHash = async (plainText, salt) => {
  const pk2 = promisify(pbkdf2);

  const derivedKey = await pk2(plainText, salt, 100000, 64, "sha512").catch(
    (error) => {
      throw error;
    }
  );

  return `${salt}.${derivedKey.toString("hex")}`;
};

export { plainTextToHash };
