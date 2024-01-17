import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  // const coverPictureLocalPath = req.files?.coverPicture[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload avatar");
  }

  // upload image to s3 bucket or cloudinary
  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
  // const coverPictureUrl = await uploadOnCloudinary(coverPictureLocalPath);

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
    // coverPicture: coverPictureUrl?.url || "",
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

export { registerUser };
