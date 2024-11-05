import mongoose, {model, Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, //one is creating the channel 
        ref: "User"
    }
}, {timestamps: true})

export const Subscription = model("Subscription" ,subscriptionSchema)