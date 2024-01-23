import { Router } from "express";
import {
  createProduct,
  getProductbyId,
  getAllProducts,
  getProductsbyCategory,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = Router();

router
  .route("/")
  .post(createProduct, [
    upload.fields([
      {
        // name, description, price, productImage, stock, category, owner
        name: "productImage", maxCount: 1,
      }
    ]),
  ])
  .get(getAllProducts);

router
  .route("/:id")
  .get(getProductbyId)
  .put(updateProduct)
  .delete(deleteProduct);

router.route("/category/:category").get(getProductsbyCategory);

export default router;
