import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    mainCategory: {
      type: String,
      required: true,
      trim: true,
      enum: ["icon", "logo", "image", "video"]
    },
    subCategory: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

categorySchema.index({ mainCategory: 1, subCategory: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
