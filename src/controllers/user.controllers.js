import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}


const registerUser = asyncHandler( async (req, res) => {
    // the flow(algorithm) of register controller

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token from response
    // check for user creation 
    // return response




    // get user details from frontend
    const {fullname, email, username, password} = req.body
    // console.log("email: ", email);
    // console.log(req.body);
    



    // validation - not empty

    // this is one way of doing the validation on all fields 
    // this is for fullname
    // if(fullname === ""){
    //     throw new ApiError(400, "fullname is required")
    // }

    if (
        [fullname, email, username, password].some((field) => field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }




    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username is already exists")
    }




    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path

    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // console.log(req.files);

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log(coverImageLocalPath);
    
    

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }


  

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }



    // create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url ||"",
        email,
        password,
        username: username.toLowerCase()
    })
    // console.log(user);

    // remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    // console.log(createdUser);
    

    // check for user creation 
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user !!! please try again")
    }
    



    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User register successfully")
    )
} )

const loginUser = asyncHandler( async(req, res) => {
    // take data from front end
    // check username or email data from front end   -- from video
    // valid user check - if not throw error
    // create refresh token and access token
    // send the cookie to user in cookie there is access and refresh token of user  -- from video
    // return res


    const {email, username, password} = req.body
    console.log(email)

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }



    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(400, "user does not exists");
    }



    const isPasswordValid = await user.isPasswordCorrect(password)  
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid user credentials");
    }


    // console.log(user._id);
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    // console.log(accessToken + ", " + refreshToken);
    


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // cookies by defaultly modify by frontend because of options the cookies is modify by only server
    const options = {
        httpOnly: true,
        secure: true
    }



    return res
    .status(200)
    .cookie( /* key */ "accessToken", /* value */ accessToken, /* additional option */ options)
    .cookie( /* key */ "refreshToken", /* value */ refreshToken, /* additional option */ options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    ) 
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "user logged out successfully")
    )
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }


    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken != user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "access token refresh successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};