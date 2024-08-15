import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //   message: "ok",
  // });

  //register user

  // steps involved :-

  // get user details from frontend / postman / thunderclient
  // validation of user details - check not empty
  // check if user already exists - check by username and email too
  // check for images and avatar
  // upload them to cloudinary, check avatar upload success or not
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  //getting user details from the user
  const { fullName, email, userName, password } = req.body;
  console.log("email: ", email);
  // if(fullName === ""){
  //   throw new ApiError(400, "Full Name is required")
  // }

  //checking for empty fields
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //checking for existing user
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //checking for avatar and cover image local file path valid or not
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //cannto read properties of undefined (error '0) - this error occurs because we have not handled the case where the user do not wish to upload a coverimage and we need to define it with empty string from cloudinary.

  //resolved the scope issue
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // uploading avatar and coverimage on cloudinary and storing their references
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  // user object creation
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  // remove password and refresh token
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for error while creating user
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully !"));
});

export { registerUser };
