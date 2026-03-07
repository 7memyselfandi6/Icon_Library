import express from "express";
import Category from "../models/Category.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Create a new category
router.post("/", requireAuth, async (req, res) => {
  try {
    let { mainCategory, subCategory } = req.body;

    if (!mainCategory || !subCategory) {
      return res.status(400).json({ error: "mainCategory and subCategory are required" });
    }

    mainCategory = mainCategory.trim();
    subCategory = subCategory.trim();

    // Pre-insert duplicate check
    const existingCategory = await Category.findOne({ mainCategory, subCategory });
    if (existingCategory) {
      return res.status(409).json({ error: "Duplicate category already exists with this name" });
    }

    const category = new Category({ mainCategory, subCategory });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Duplicate category already exists in the database" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a category
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { mainCategory, subCategory } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (mainCategory) category.mainCategory = mainCategory;
    if (subCategory) category.subCategory = subCategory;

    await category.save();
    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Duplicate category" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a category
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all categories with icon count for each
router.get("/", async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "icons",
          let: { main: "$mainCategory", sub: "$subCategory" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$mainCategory", "$$main"] },
                    { $eq: ["$subCategory", "$$sub"] }
                  ]
                }
              }
            }
          ],
          as: "icons",
        },
      },
      {
        $project: {
          _id: 1,
          mainCategory: 1,
          subCategory: 1,
          createdAt: 1,
          iconCount: { $size: "$icons" },
        },
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);
    res.json(categories);
  } catch (error) {
    console.error("Fetch categories error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
