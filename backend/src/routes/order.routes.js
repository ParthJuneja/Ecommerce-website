import { Router } from "express";
import {
  addToCart,
  removeFromCart,
  placeOrderFromCart,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = Router();

router.route("/").post(addToCart).get(getAllOrders);

router.route("/placeorder").post(placeOrderFromCart);

router.route("/:id").get(getOrderById).put(updateOrderStatus);

router.route("/removefromcart/:id").delete(removeFromCart);

export default router;
