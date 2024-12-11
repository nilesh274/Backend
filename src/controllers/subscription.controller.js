import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel Id");
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const subscribed = await Subscription.findOne({subscriber: userId, channel: channelId})
    console.log(subscribed);
    

    if(subscribed){
        const removeSubscription = await Subscription.deleteOne({subscriber: userId, channel: channelId})

        if(!removeSubscription){
            throw new ApiError(500, "Failed to remove subscription")
        }

        return res
            .status(200)
            .json(new ApiResponse(201, [], "Subscription removed successfully"))
    }else{
        const addSubcription = await Subscription.create({subscriber: userId, channel: channelId})

        if (!addSubcription) {
            throw new ApiError(500, "Failed to add subscription")
        }

        console.log(addSubcription);
        

        return res
            .status(200)
            .json(new ApiResponse(201, addSubcription, "Subscription added successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const {page = 1, limit = 10} = req.query
    const pageParse = parseInt(page, 10);
    const limitParse = parseInt(limit, 10);

    const channelObjId = new mongoose.Types.ObjectId(channelId);
    if(!isValidObjectId(channelObjId)) {
        throw new ApiError(400, "Invalid channel Id");
    }

    const userId = req.user._id
    if(channelId !== String(userId)) {
        return res.
        status(403).
        json(new ApiResponse(403, [], 'You are not authorized to get the channel subscribers'))
    }

    const channelSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelObjId
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullname: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribers"
        },
        {
            $replaceRoot: {newRoot: "$subscribers"}
        },
        {
            $sort: {createdAt: 1}
        },
        {
            $limit: limitParse
        },
        {
            $skip: (pageParse - 1) * limitParse
        }
    ])


    if(!channelSubscribers || channelSubscribers.length === 0){
        throw new ApiError(500, "Failed to Fetch the subscriber")
    }

    return res
        .status(200)
        .json(new ApiResponse(201, channelSubscribers, "Fetched Channel Subscribers successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    
    const {page = 1, limit = 10} = req.query
    const pageParse = parseInt(page, 10);
    const limitParse = parseInt(limit, 10);

    const userId = req.user._id
    if (subscriberId !== String(userId)) {
        return res
        .status(403)
        .json(new ApiResponse(403, [], 'You are not authorized to view these subscriptions'));
    }

    if(!isValidObjectId(subscriberId)) {
        throw new ApiError(400, 'Invalid subscriber Id')
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match:{
                subcriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedTo"
        },
        {
            $replaceRoot: {newRoot: "$subscribedTo"}
        },
        {
            $sort: {createdAt: 1}
        },
        {
            $limit: limitParse
        },
        {
            $skip: (pageParse - 1) * limitParse
        }
    ])

    if(!subscribedChannels || subscribedChannels.length === 0){
        return res
            .status(200)
            .json(new ApiResponse(201, [], "No channels subscribed"))
    }

    return res
        .status(200)
        .json(new ApiResponse(201, subscribedChannels, "Fetched Subscribed channels successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}