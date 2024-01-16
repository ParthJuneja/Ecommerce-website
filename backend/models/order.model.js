import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productID : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  }
}, {timestamps: true});

const OrderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }],
  orderItems: [{
    type: [OrderItemSchema],
    required: true
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  address : {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'PayPal'],
    default: 'COD'
  },
  orderStatus: {
    type: String,
    enum: ['Pending','Shipped','Delivered','Cancelled'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {timestamps: true});

export const Order = mongoose.model('Order', OrderSchema);

