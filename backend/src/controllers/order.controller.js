import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";

const addToCart = asyncHandler(async (req, res) => {
  try {
    // get product id from req.body
    const { productId } = req.body;
    // get product from db
    const product = await Product.findById(productId);
    // check if product quantity is greater than 0 and product is available
    if (!product || product.stock <= 0) {
      throw new ApiError(500, "Product not available");
    }
    // check if product is already in cart
    if (req.session.cart) {
      const index = req.session.cart.findIndex(
        (item) => item.productId === productId
      );
      if (index !== -1) {
        throw new ApiError(400, "Product already in cart");
      }
    }
    // add to cart and assign cart to session
    req.session.cart = [
      ...req.session.cart,
      { productId: product._id, quantity: 1 },
    ];
    // return success response
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          req.session.cart,
          "Product successfully added to cart"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while adding to cart");
  }
});

const removeFromCart = asyncHandler(async (req, res) => {
  try {
    // check if cart exists in session
    if (!req.session.cart) {
      throw new ApiError(400, "Cart is empty");
    }
    // get product id from req.body
    const { productId } = req.body;
    // get product from db
    const product = await Product.findById(productId);
    // check if product is in cart
    const index = req.session.cart.findIndex(
      (item) => item.productId === productId
    );
    if (index === -1) {
      throw new ApiError(400, "Product not in cart");
    }
    // remove product from cart
    req.session.cart.splice(index, 1);
    // return success response
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          req.session.cart,
          "Product successfully removed from cart"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while removing from cart");
  }
});

const placeOrderFromCart = asyncHandler(async (req, res) => {
  try {
    // check if cart exists in session
    if (!req.session.cart) {
      throw new ApiError(400, "Cart can't be empty");
    }
    // get products from cart
    const products = req.session.cart.map((item) => item.productId);
    // get products from db
    const productsFromDb = await Product.find({ _id: { $in: products } });
    // check if all products are available
    const productsNotAvailable = productsFromDb.filter(
      (product) => product.stock <= 0
    );
    if (productsNotAvailable.length > 0) {
      // return the products that are not available
      const unavailableProducts = productsNotAvailable.map(
        (product) => product.name
      );
      throw new ApiError(400, `${unavailableProducts} are not available`);
    }
    // create order
    const order = new Order({
      customer: req.user._id,
      orderItems: req.session.cart,
      totalAmount: req.session.cart.reduce(
        (acc, item) => acc + item.quantity * item.price,
        0
      ),
      isPaid: false,
      address: req.body.address,
      paymentMethod: req.body.paymentMethod,
      orderStatus: "Pending",
      createdAt: Date.now(),
    });
    // save order to db

    const createdOrder = await order.save();
    // check if order is saved
    if (!createdOrder) {
      throw new ApiError(500, "Something went wrong while creating order");
    }
    // update product stock
    const productIds = req.session.cart.map((item) => item.productId);
    const productsToUpdate = await Product.find({ _id: { $in: productIds } });
    productsToUpdate.forEach(async (product) => {
      const index = req.session.cart.findIndex(
        (item) => item.productId === product._id
      );
      product.stock = product.stock - req.session.cart[index].quantity;
      await product.save();
    });
    // clear cart
    req.session.cart = [];
    // return success response
    return res
      .status(200)
      .json(new ApiResponse(200, createdOrder, "Order placed successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while placing order (beginning process)"
    );
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({}).populate("customer", "name email");
    if (!orders) {
      throw new ApiError(404, "No orders found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, orders, "Orders fetched successfully"));
  } catch (error) {
    throw new ApiError(404, "No orders found");
  }
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "customer",
    "name email"
  );

  if (order) {
    return res
      .status(200)
      .json(new ApiResponse(201, order, "Order fetched successfully"));
  } else {
    throw new ApiError(404, "Order not found");
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (order) {
    order.orderStatus = status;
    const updatedOrder = await order.save();
    return res
      .status(200)
      .json(new ApiResponse(201, updatedOrder, "Order updated successfully"));
  } else {
    throw new ApiError(404, "Order not found");
  }
});

export {
  addToCart,
  removeFromCart,
  placeOrderFromCart,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
