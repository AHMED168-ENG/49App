import mongoose from "mongoose";
import dotenv from "dotenv";

const connectDB = async () => {
  try {
    dotenv.config({ path: "./.env" });

    await mongoose.connect(process.env.MONGODB_URI_REFACTOR, {
      useNewUrlParser: true,
      useUnifiedTopology: false,
    });

    console.log("Database Connected");
  } catch (error) {
    throw error;
  }
};

export { connectDB };
