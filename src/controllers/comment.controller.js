import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { videoId } = req.params
    const user = new mongoose.Types.ObjectId(req.user?._id)

    if(!content) {
        throw new ApiError(400, "Content is required")
    }
    
    if(!user) {
        throw new ApiError(401, "Login to add comment")
    }

    if(!videoId) {
        throw new ApiError(400, "Video id not found")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: user
    })

    if (!comment) {
        throw new ApiError(500, "Failed to add comment")
    }

    return res
        .status(201)
        .json(new ApiResponse(200, "comment added successfully"))
})

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    const pageParse = parseInt(page, 10);
    const limitParse = parseInt(limit, 10);

    if(!videoId){
        throw new ApiError(400, "Video id not found")
    }


    const getComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[{
                    $project: {
                        avatar: 1,
                        username: 1,
                        fullname: 1
                    }
                }]
            }
        },
        {
            $skip: (pageParse - 1) * limitParse
        },
        {
            $limit: limitParse
        },
        {
            $sort: {createdAt: -1}
        }
    ])

    if (getComments < 1) {
        return res  
            .status(201)
            .json(new ApiResponse(200, getComments, "No comments"))
    }

    return res  
            .status(201)
            .json(new ApiResponse(200, getComments, "comments Fetched successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if(!commentId){
        throw new ApiError(400, "Invalid comment Id")
    }

    if(!content){
        throw new ApiError(400, "content is reuqired")
    }

    const newComment = await Comment.findByIdAndUpdate(
        {
            _id: commentId,
            owner: new mongoose.Types.ObjectId(req.user._id)
        },
        {
            $set: {
                content,
            }
        },
        {
            new: true,
        }
    )

    if(!newComment){
        throw new ApiError(500, "Failed to updated comment")
    }

    return res
        .status(201)
        .json(new ApiResponse(200, newComment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if(!commentId){
        throw new ApiError(400, "Invalid comment Id")
    }

    const removeComment = await Comment.deleteOne({_id: commentId})
    if(removeComment.deletedCount == 0){
        throw new ApiError(500, "Failed to delete playlist from database");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, [], "comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}