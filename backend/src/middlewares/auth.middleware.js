import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWTToken = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("authorization")?.replace("Bearer ", ""); // get token from cookies or header

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    // verify token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // check if user exists
    const user = await User.findById(decoded?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }
    // // check if token is valid
    // const isTokenValid = user.refreshToken === token;
    // if (!isTokenValid) {
    //   throw new ApiError(401, "Unauthorized");
    // }
    // set user in req object
    req.user = user;
    // next middleware
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized");
  }
});
