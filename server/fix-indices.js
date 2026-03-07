import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./src/models/Category.js";

dotenv.config();

const fixIndices = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI_ONLINE ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/icon_library";

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for index fix");

    // Drop all indices on the Category collection
    try {
      await Category.collection.dropIndexes();
      console.log("Dropped all indexes on Category collection");
    } catch (err) {
      console.log("No indexes to drop or collection doesn't exist");
    }

    // Re-create the correct index
    await Category.collection.createIndex(
      { mainCategory: 1, subCategory: 1 },
      { unique: true, name: "main_sub_unique" }
    );
    console.log("Created unique index on (mainCategory, subCategory)");

  } catch (error) {
    console.error("Index fix failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

fixIndices();
