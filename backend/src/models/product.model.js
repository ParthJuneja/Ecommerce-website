import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true },
    description: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    price: { type: String, required: true },
    productImage: { type: String, required: true },
    stock: { type: String, required: true, default: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    id: String,
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", ProductSchema);
