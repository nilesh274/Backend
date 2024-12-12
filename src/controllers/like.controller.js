import mongoose, {isValidObjectId, Mongoose} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { describe } from "node:test"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id
    const videoObjId = new mongoose.Types.ObjectId(videoId);

    if(!isValidObjectId(videoObjId)){
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById({_id: videoId})
    if(!video){
        throw new ApiError(404, "video not found");
    }

    const like = await Like.findOne({video: videoId, likeBy: userId})
    if(like){
        const removelike = await Like.deleteOne({video: videoId, likeBy: userId});
        if(!removelike){
            throw new ApiError(500, 'Failed to remove video like')
        }

        return res
            .status(201)
            .json(new ApiResponse(200, {}, "Video like removed successfully"))
    }else{
        const addlike = await Like.create({video: videoId, likeBy: userId});
        if(!addlike){
            throw new ApiError(500, "Failed to add video like")
        }

        return res
            .status(201)
            .json(new ApiResponse(200, addlike, "Video like added successfully"))
    }
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id
    const commentObjId = new mongoose.Types.ObjectId(commentId);

    if(!isValidObjectId(commentObjId)){
        throw new ApiError(400, "Invalid video ID");
    }

    const comment = await Comment.findById({_id: commentId})
    if(!comment){
        throw new ApiError(404, "comment not found")
    }

    const like = await Like.findOne({comment: commentId, likeBy: userId})
    if (like) {
        const removeLike = await Like.deleteOne({comment: commentId, likeBy: userId})
        if(!removeLike){
            throw new ApiError(500, 'Failed to remove comment like')
        }

        return res
            .status(201)
            .json(new ApiResponse(200, {}, "Comment like removed successfully"))
    }else{
        const addLike = await Like.create({comment: commentId, likeBy: userId})
        if(!addLike){
            throw new ApiError(500, "Failed to add comment like")
        }

        return res
            .status(201)
            .json(new ApiResponse(200, addLike, "Comment like added successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id
    const tweetObjId = new mongoose.Types.ObjectId(tweetId)

    if(!isValidObjectId(tweetObjId)){
        throw new ApiError(400, "Invalid tweet Id")
    }

    const tweet = await Tweet.findById({_id: tweetId})
    if(!tweet){
        throw new ApiError(500, "Tweet not found")
    }

    const like = await Like.findOne({tweet: tweetId, likeBy: userId})
    if(like){
        const removeLike = await Like.deleteOne({tweet: tweetId, likeBy: userId})
        if(!removeLike){
            throw new ApiError(500, "Failed to remove tweet like")
        }

        return res
            .status(201)
            .json(new ApiResponse(200, {}, "Tweet like removed successfully"))
    }else{
        const addLike = await Like.create({tweet: tweetId, likeBy: userId})
        if(!addLike){
            throw new ApiError(500, "Failed to add tweet like")
        }

        return res
            .status(201)
            .json(new ApiResponse(200, addLike, "Tweet like added successfully"))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const {page = 1, limit = 10} = req.query
    const pageParse = parseInt(page, 10)
    const limitParse = parseInt(limit, 10)
    const userId = new mongoose.Types.ObjectId(req.user._id)

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likeBy: userId
            }
        },
        {
            $lookup: {
                from:"vides",
                localField: "video",
                foreignField: "_id",
                as:"likedVideo",
                pipeline: [
                    {
                        $project: {
                            videofile: 1,
                            thumbnail: 1,
                            title: 1,
                            describe: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1,
                            owner: 1
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        fullname: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $arrayElemAt: ["$owner", 0]
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideos"
        },
        {
            $replaceRoot: {
                newRoot: "$likedVideos"
            }
        }, 
        {
            $sort: {createdAt: -1}
        },
        {
            $skip: (pageParse - 1) * limitParse
        },
        {
            $limit: limitParse
        }
    ])

    if(likedVideos == 0){
        return res
        .status(201)
        .json(new ApiResponse(200, [], "No liked videos"))
    }

    return res
        .status(201)
        .json(new ApiResponse(200, likedVideos, "Fetched liked video successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}