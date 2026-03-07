import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./src/models/Category.js";

dotenv.config();

const cleanup = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI_ONLINE ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/icon_library";

    await mongoose.connect(mongoUri);

    const result = await Category.deleteMany({
      $or: [{ main: null }, { sub: null }],
    });

    console.log(`Cleanup successful, removed ${result.deletedCount} documents.`);
  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

cleanup();
