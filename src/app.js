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


//routes declaration
app.use("/api/v1/users", userRouter) 
app.use("/api/v1/healthcheck", healthCheckRouter)
app.use("/api/v1/video", video)
app.use("/api/v1/playlist", playlist)
app.use("/api/v1/subscription", subscription)

export {app};