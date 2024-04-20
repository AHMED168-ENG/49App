import { hash } from "bcrypt";

const passwordToHash = async (password) => {
  const passwordPaper = process.env.PASSWORD_PAPER;

  return await hash(`${password}${passwordPaper}`, 10).catch((error) => {
    throw error;
  });
};

export { passwordToHash };
