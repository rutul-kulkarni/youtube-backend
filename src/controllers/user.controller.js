import { User } from "../models/user.model.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from ui
  //validation - not empty
  //check if user exist
  //check for images, check for avtar
  //upload to cloudinary
  //create user object - create entry in db

  const { fullName, email, userName, password } = req.body;

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new APIError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new APIError(409, "User allready exists.");
  }

  console.log("File", req.files);
  const avatarLocalPath = req.files?.avatar[0].path;
  const coverImageLocalPath = req.files?.coverImage[0].path;

  if (!avatarLocalPath) {
    throw new APIError(400, "Avatar files is required");
  }

  const avtar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avtar) {
    throw new APIError(400, "Avatar files is required");
  }

  const user = await User.create({
    fullName,
    avatar: avtar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );

  if (!createdUser) {
    new APIError(500, "something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new APIResponse(200, createdUser, "User created successfully"));
});

export { registerUser };
