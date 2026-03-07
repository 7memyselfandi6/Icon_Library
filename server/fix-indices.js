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

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for index fix");

    // Drop all indices on the Category collection to clear any stale unique constraints
    try {
      console.log("Attempting to drop all indexes on Category collection...");
      await Category.collection.dropIndexes();
      console.log("Successfully dropped all indexes.");
    } catch (err) {
      console.log("No indexes to drop or collection doesn't exist yet.");
    }

    // Re-create the correct compound unique index on (mainCategory, subCategory)
    // This allows same subCategory under different mainCategories, 
    // but prevents duplicate (main, sub) pairs.
    console.log("Creating unique compound index on { mainCategory: 1, subCategory: 1 }...");
    await Category.collection.createIndex(
      { mainCategory: 1, subCategory: 1 },
      { unique: true, name: "main_sub_unique" }
    );
    console.log("Index creation successful.");

  } catch (error) {
    console.error("Index fix operation failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

fixIndices();
