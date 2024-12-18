import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential:true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js';
import healthCheckRouter from './routes/healthcheck.routes.js';
import video from './routes/video.routes.js'
import playlist from './routes/playlist.routes.js'
import subscription from './routes/subscription.routes.js'
import tweet from './routes/tweet.routes.js'
import comment from './routes/comment.routes.js'
import like from './routes/like.routes.js'
import dashboard from './routes/dashboard.routes.js'



//routes declaration
app.use("/api/v1/users", userRouter) 
app.use("/api/v1/healthcheck", healthCheckRouter)
app.use("/api/v1/video", video)
app.use("/api/v1/playlist", playlist)
app.use("/api/v1/subscription", subscription)
app.use("/api/v1/tweet", tweet)
app.use("/api/v1/comment", comment)
app.use("/api/v1/like", like)
app.use("/api/v1/dashboard", dashboard)

export {app};