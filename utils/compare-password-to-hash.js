import { compare } from "bcrypt";

const comparePasswordToHash = async (plainTextPassword, hashedPassword) => {
  try {
    const passwordPaper = process.env.PASSWORD_PAPER;
    return await compare(
      `${plainTextPassword}${passwordPaper}`,
      hashedPassword
    );
  } catch (error) {
    throw error;
  }
};

export { comparePasswordToHash };
