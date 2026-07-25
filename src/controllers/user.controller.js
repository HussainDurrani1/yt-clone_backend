import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import { ApiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/coudinary.js'

const registerUser = asyncHandler(async (req, res) => {

    const { fullName, email, username, password } = req.body
    // console.log(fullName, email, username, password);

    if (
        [fullName, email, password, username].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    // console.log(existedUser);
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files);
    // console.log(req.files?.avatar);
    // console.log(req.files?.avatar[0]);
    // console.log(req.files?.avatar[0]?.path);

    // const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 && req.files.coverImage[0].path) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0 && req.files.avatar[0].path) {
        avatarLocalPath = req.files.avatar[0].path;
    }

    // console.log(avatarLocalPath, coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if (!avatar) {
        throw new ApiError(400, "Avatar File is required")
    }

    const user = await User.create({
        fullName,
        avatar,
        coverImage: coverImage || '',
        email,
        watchHistory: [],
        password,
        username: username.toLowerCase(),
    })

    // console.log(user);
    // console.log(user._id);
    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the User")
    }

    console.log(`User is registered: ${createdUser.username}`);
    return res.status(201).json(new ApiResponse(200, createdUser, "User Registered Successfully✌️"))

})

export { registerUser }