import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "User registered successfully",
    success: true,
    data: req.file,
  })
});

export { registerUser };
