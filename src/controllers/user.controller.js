import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import { ApiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/coudinary.js'
import { jwt } from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access & Refresh Token.")
    }
}

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

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({ $or: [{ username }, { email }] })

    if (!user) {
        throw new ApiError(404, "User does not exist, register first.")
    }

    const isPaswordValid = await user.isPasswordCorrect(password);

    if (!isPaswordValid) {
        throw new ApiError(401, "Invalid user credentials.")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    console.log(`User ${loggedInUser.username} loggedIn successfully...`);
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User LoggedIn successfully."))

})

const logoutUser = asyncHandler(async (req, res) => {
    // We will get the user details through the auth middleware

    // This is deprecated now:
    // await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true })

    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { returnDocument: 'after' }
    );

    const options = {
        httpOnly: true,
        secure: true,
    }


    console.log(`User logged out successfully.`);
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully."))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request.")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used.")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access Token refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export { registerUser, loginUser, logoutUser, refreshAccessToken }