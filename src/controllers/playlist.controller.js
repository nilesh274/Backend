import mongoose, { isValidObjectId } from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user._id;
    const {videos} = req.body;

    if(!name) {
        throw new ApiError(400, "name field are required");
    }

    if(!videos || videos.length < 1){
        throw new ApiError(400, "Atleast one video is required to create playlist");
    }

    const videoIds = videos.map(videoId => {
        return new mongoose.Types.ObjectId(videoId)
    })

    const playlist = await Playlist.create({
        name,
        description : description || "", 
        videos: videoIds,
        owner: userId
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating the playlist !!! please try again");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "playlist created successfully"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {page = 1, limit = 10 } = req.query;
    const parsingPage = parseInt(page, 10);
    const parsingLimit = parseInt(limit, 10);

    const validUserId = new mongoose.Types.ObjectId(userId);
    if(!isValidObjectId(validUserId)){
        throw new ApiError(400, "Invalid user Id");
    }

    const getplaylists = await Playlist.aggregate([
        {
            $match: {
                owner : validUserId
            }
        },
        {
            $sort: {
                createdAt : -1,
            } 
        },
        {
            $skip: (parsingPage - 1) * parsingLimit,
        },
        {
            $limit: parsingLimit,
        }
    ])

    if(getplaylists.length === 0){
        return res
            .status(200)
            .json(new ApiResponse(201, [], "No playlist created by the user"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, getplaylists, "Fetch the playlist successfully"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    const validPlaylistId = new mongoose.Types.ObjectId(playlistId);
    if (!validPlaylistId) {
        throw new ApiError(400, "Invalid Playlist Id");
    }

    const getPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: validPlaylistId,
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
                            username: 1,
                            fullname: 1,
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
            $project:{
                owner: 0,
                ownerdata: 0,
            }
        }
    ]);

    if (!getPlaylist || getPlaylist < 1) {
        throw new ApiError(500, "Playlist not found");
    } 

    return res
        .status(200)
        .json(new ApiResponse(201, getPlaylist[0], "Playlist fetched successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const playlistObjectId = new mongoose.Types.ObjectId(playlistId)
    const videoObjectId = new mongoose.Types.ObjectId(videoId)
    
    if(!playlistObjectId) {
        throw new ApiError(400, 'Playlist ID is required')
    }
    if(!videoObjectId) {
        throw new ApiError(400, 'Video ID is required to add') 
    }

    const addvideo = await Playlist.findByIdAndUpdate(
        playlistObjectId,
        {
            $push:{
               videos: videoObjectId, 
            }
        },
        {
            new: true,
        }
    )

    if (!addvideo) {
        throw new ApiError(500, 'Failed to add video to playlist')
    }

    return res
        .status(200)
        .json(new ApiResponse(201, addvideo, "video added successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const playlistObjectId = new mongoose.Types.ObjectId(playlistId)
    const videoObjectId = new mongoose.Types.ObjectId(videoId)
    
    if(!playlistObjectId) {
        throw new ApiError(400, 'Playlist ID is required')
    }
    if(!videoObjectId) {
        throw new ApiError(400, 'Video ID is required to add') 
    }

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistObjectId,
        {
            $pull:{
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true,
        }
    )

    if(!removeVideo){
        throw new ApiError(500, "Failed to remove video from playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(201, removeVideo, "video removed successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlistObjId = new mongoose.Types.ObjectId(playlistId);
    if(!playlistObjId){
        throw new ApiError(400, "Invalid Playlist Id");
    }

    const deletePlayList = await Playlist.deleteOne({_id: playlistObjId}) 

    if(deletePlayList.deletedCount == 0){
        throw new ApiError(500, "Failed to delete playlist from database");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    const playlistObjId = new mongoose.Types.ObjectId(playlistId);
    if(!playlistObjId){
        throw new ApiError(400, "Invalid Playlist Id");
    }
    if(!name && !description){
        throw new new ApiError(400, "name or description is required")
    }

    const PlaylistToUpdate = await Playlist.findByIdAndUpdate(
        playlistObjId,
        {
            $set:{
                name,
                description,
            }
        },
        {
            new: true,
        }
    )

    if (!PlaylistToUpdate) {
        throw new ApiError(500, "Failed to update playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "PlayList is update successfully"));

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}