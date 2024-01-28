import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createProduct = asyncHandler(async (req, res) => {
  try {
    const { name, description, price, productImage, stock, category } =
      req.body;
    const owner = req.user?._id;
    if (!owner) {
      throw new ApiError(401, "User not signed in");
    }
    const categoryVal = Category.findOne({ name: category });
    if (!categoryVal) {
      throw new ApiError(404, "Category not found");
    }
    //TODO: check if owner exists and is signed in.

    const product = new Product({
      name,
      description,
      price,
      productImage,
      stock,
      categoryVal,
      owner,
    });

    console.log("product", product);

    const createdProduct = await product.save();

    if (!createdProduct) {
      throw new ApiError(400, "Something went wrong while creating product");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, createdProduct, "Product created successfully")
      );
  } catch (error) {
    throw new ApiError(406, error.message);
  }
});

const getProductbyId = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    return res
      .status(200)
      .json(new ApiResponse(201, product, "Product created successfully"));
  } else {
    throw new ApiError(404, "Product not found");
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({});
    if (!products) {
      throw new ApiError(404, "No products found");
    }
    // check if products found are greater than 0
    if (products.length <= 0) {
      throw new ApiError(404, "0 products found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, products, "Products fetched successfully"));
  } catch (error) {
    throw new ApiError(404, "No products found");
  }
});

const getProductsbyCategory = asyncHandler(async (req, res) => {
  const productsinCat = await Product.find({ category: req.params.category });

  if (!productsinCat) {
    throw new ApiError(404, "No products found in this category");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, productsinCat, "Products fetched successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    const { name, description, price, productImage, stock, category, owner } =
      req.body;

    product.name = name;
    product.description = description;
    product.price = price;
    product.productImage = productImage;
    product.stock = stock;
    product.category = category;
    product.owner = owner;

    const updatedProduct = await product.save();

    return res
      .status(200)
      .json(new ApiResponse(200, updatedProduct, "Product updated"));
  } else {
    throw new ApiError(404, "Product not found");
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.remove();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Product deleted successfully"));
  } else {
    throw new ApiError(404, "Product not found");
  }
});

export {
  createProduct,
  getProductbyId,
  getAllProducts,
  getProductsbyCategory,
  updateProduct,
  deleteProduct,
};
