import mongoose, { isValidObjectId } from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Video } from '../models/video.model.js';
import { deleteFromCloudinary, uploadOnCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const limitParse = parseInt(limit, 10);
    const sortOption = {}
    sortOption[sortBy] = sortType === 'asc' ? 1 : -1;

    const getallvideo = await Video.aggregate([
        {
            $match: {
                isPublished: true,
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerdata",
                pipeline: [
                    {
                        $project: { 
                            avatar: 1,
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                ownerDetails:{
                    $arrayElemAt: ["$ownerdata", 0]
                }
            }
        },
        {
            $project: {
                owner : 0,
                ownerdata : 0,
            }
        },
        {
            $skip: (page - 1) * limitParse
        },
        {
            $limit: limitParse
        },
        {
            $sort: sortOption
        }
    ])

    if(!getallvideo) {
        throw new ApiError(400, 'videos Not found')
    }

    return res
    .status(200)
    .json(new ApiResponse(201, getallvideo, 'Videos fetched successfully'))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const videoLocalPath = req.files?.videofile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoLocalPath) {
        throw new ApiError(401, "video is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(401, "thumbnail is reuqired");
    }


    const videoPlished = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoPlished.url) {
        throw new ApiError(400, "Failed to upload video file on cloudinary");
    }

    if (!thumbnail.url) {
        throw new ApiError(400, "Failed to upload thumbnail file on cloudinary");
    }

    const video = await Video.create({
        videofile: videoPlished.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        duration: videoPlished.duration,
        owner: new mongoose.Types.ObjectId(req.user?.id)
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while uploading the video !!! please try again")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, video, "video upload successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    const video = await Video.findById(videoId).populate({
        path: "owner",
        select: "-password -refreshToken -watchHistory -coverImage"
    });

    if (!video) {
        throw new ApiError(500, "Unable to get requested video")
    }

    return res
        .status(201)
        .json(new ApiResponse(200, video, "Fetch video successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!videoId) {
        throw new ApiError(400, "Invalid video Id");
    }

    if (title === '' || description === '') {
        throw new ApiError(400, "title and description is required");
    }

    const oldvideo = await Video.findById(videoId);
    const oldThumbnail = oldvideo?.thumbnail;


    let thumbnailFile;
    if (thumbnailLocalPath) {
        thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnailFile.url) {
            throw new ApiError(500, "Failed to upload thumbnail file!!! please try again");
        }

        await deleteFromCloudinary(oldThumbnail);
    }


    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnailFile?.url || oldThumbnail,
                title: title,
                description: description
            },
        },
        {
            new: true,
        }
    )

    if (!updateVideo) {
        throw new ApiError(500, "Something went wrong will updating the video");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, updateVideo, "video updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }


    const videoObj = await Video.findById(videoId);
    if (!videoObj) {
        throw new ApiError(501, "video not found");
    }
    // console.log(videoObj);


    try {
        await deleteVideoFromCloudinary(videoObj.videofile);
        await deleteFromCloudinary(videoObj.thumbnail);
    } catch (error) {
        throw new ApiError(500, "Something went worng will deleting the video from cloud");
    }


    const videoDataDeleted = await Video.deleteOne({ _id: videoId });
    if (!videoDataDeleted.deletedCount) {
        throw new ApiError(500, "Failed to delete video from database")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "video delete successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }


    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(500, "Failed to fetch the video for database");
    }


    const isPublished = video.isPublished;
    if (isPublished) {
        isPublished: false;
    } else {
        isPublished: true;
    }


    const videoObj = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !isPublished
            }
        },
        {
            new: true,
        }
    )
    if (!videoObj) {
        throw new ApiError(500, "Something went wrong will toggle the Publish status");
    }


    return res
        .status(201)
        .json(new ApiResponse(201, videoObj, "Publish status toggle successfully"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}