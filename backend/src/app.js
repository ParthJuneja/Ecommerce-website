import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))

app.use(express.json({
  limit: "50kb"
}));
app.use(express.urlencoded({
  extended: true,
  limit: "50kb"
}));
app.use(express.static("public"));
app.use(cookieParser());

// Routes import
import userRouter from './routes/user.routes.js';
import productRouter from './routes/product.routes.js';
import orderRouter from './routes/order.routes.js';

// Routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);




export default app;