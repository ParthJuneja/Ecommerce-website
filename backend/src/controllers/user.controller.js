import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateJWTTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating tokens, problem here"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //user details from frontend
  const { fullname, username, email, password } = req.body;
  console.log("fullname", fullname);
  console.log("username", username);
  console.log("email", email);

  // validation
  if (!fullname || !username || !email || !password) {
    throw new ApiError(400, "Please fill all fields");
  }

  // check if user exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with same email or username already exists");
  }

  // check images
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverPictureLocalPath = null;
  if (
    req.files &&
    Array.isArray(req.files.coverPicture) &&
    req.files.coverPicture.length > 0
  ) {
    coverPictureLocalPath = req.files.coverPicture[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload avatar");
  }

  // upload image to s3 bucket or cloudinary
  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
  const coverPictureUrl = await uploadOnCloudinary(coverPictureLocalPath);

  if (!avatarUrl) {
    throw new ApiError(500, "Error while uploading avatar");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatarUrl.url,
    coverPicture: coverPictureUrl?.url || "",
  });

  // check user creation
  const checkUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!checkUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(201, checkUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { username, email, password } = req.body;
  // username or email
  if (!(username || email)) {
    throw new ApiError(400, "ERROR: Please provide username or email");
  }
  // Oauth - google, facebook, github
  // validate user details from already existing db
  const user = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email }],
  });
  if (!user) {
    throw new ApiError(400, "Invalid credentials");
  }
  // check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Password Incorrect");
  }

  // access and refresh token (jwt)
  const { accessToken, refreshToken } = await generateJWTTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // user.refreshToken = refreshToken;
  // send via secure cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  // return response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
  // sign in
});

const logoutUser = asyncHandler(async (req, res) => {
  // user is there coz of middleware verifyJWTToken
  // clear cookies
  User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.requestToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  // check if refresh token is valid
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Expired Token");
    }

    // generate new access token
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    const { accessToken, newrefreshToken } = await generateJWTTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newrefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  // jwt is verified because of jwt middleware.
  // user is logged in
  const { oldPass, newPass, confirmPass } = req.body;
  const user = await User.findById(req.user?._id);
  const isPassCorrect = await user.comparePassword(oldPass);
  if (!isPassCorrect) {
    throw new ApiError(400, "Password is incorrect");
  }
  if (newPass !== confirmPass) {
    throw new ApiError(400, "Passwords do not match");
  }
  user.password = newPass;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user details"));
});

const updateDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullname, email },
    },
    { new: true }
  ).select("-password -refreshToken");

  await user.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, {}, "Changes saved"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload avatar");
  }
  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarUrl) {
    throw new ApiError(500, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatarUrl.url },
    },
    { new: true }
  ).select("-password -refreshToken");
  await user.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, user, "Avatar updated"));
});

const updateCoverPicture = asyncHandler(async (req, res) => {
  const coverPictureLocalPath = req.file?.coverPicture[0]?.path;
  if (!coverPictureLocalPath) {
    throw new ApiError(400, "Please upload cover picture");
  }
  const coverPictureUrl = await uploadOnCloudinary(coverPictureLocalPath);
  if (!coverPictureUrl) {
    throw new ApiError(500, "Error while uploading cover picture");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverPicture: coverPictureUrl.url },
    },
    { new: true }
  ).select("-password -refreshToken");
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover picture updated"));
});

// TODO: old image delete from cloudinary

export {
  generateJWTTokens,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateDetails,
  updateAvatar,
  updateCoverPicture,
};
