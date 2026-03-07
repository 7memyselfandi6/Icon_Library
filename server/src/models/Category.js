import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    mainCategory: {
      type: String,
      required: true,
      trim: true,
      enum: ["icon", "logo", "image", "video"]
    },
    subCategory: { 
      type: String, 
      required: true, 
      trim: true 
    }
  },
  { 
    timestamps: true,
    // Ensure Mongoose doesn't use old indexes and tries to build new ones
    autoIndex: true 
  }
);

// Explicitly define the compound index. 
// This allows the same subCategory (e.g. "Food") under different mainCategories (e.g. "Icon" and "Logo").
categorySchema.index({ mainCategory: 1, subCategory: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
