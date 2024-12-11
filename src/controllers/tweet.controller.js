import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if(!content){
        throw new ApiError(400, "content is required");
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "User not found");
    }
    const tweet = await Tweet.create({
        content,
        owner: userId
    })

    if(!tweet){
        throw new ApiError(500, "Failed to create tweet");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, tweet, "Tweet is created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {page = 1, limit = 10} = req.query;
    const pageParse = parseInt(page, 10);
    const limitParse = parseInt(limit, 10);

    if(!userId){
        throw new ApiError(400, "User not found");
    }


    const userTweets = await Tweet.find({owner: userId})
        .skip((pageParse - 1) * limitParse)
        .limit(limitParse)
        .sort({createdAt: -1})

    if (userTweets < 1) {
        return res
            .status(201)
            .json(new ApiResponse(200, [], "No Tweet found"))
    }

    return res
            .status(201)
            .json(new ApiResponse(200, userTweets, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if(!tweetId){
        throw new ApiError(400, "Tweet not found")
    }

    if(!content){
        throw new ApiError(400, "Content is rquired")
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        {
            $set: {
                content,
            }
        },
        {
            new: true,
        }
    )

    if(!newTweet){
        throw new ApiError(500, "Failed to update tweet")
    }

    return res
        .status(201)
        .json(new ApiResponse(200, newTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if(!tweetId){
        throw new ApiError(400, "Tweet not found")
    }

    const removeTweet = await Tweet.findByIdAndDelete(tweetId);

    if(removeTweet.deletedCount == 0){
        throw new ApiError(500, "Failed to delete tweet")
    }

    return res
        .status(201)
        .json(200, removeTweet, "Tweet deleted successfully")
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}