// nodemon is use reload the server if there is change in index.js file
// require('dotenv').config({path: './env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path: "./.env"
})


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is runing at port ${process.env.PORT}`);
        
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!!", err);
})




















/*
import express from "express";
const app = express();
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        
        app.on("error:", (error) => {
            console.log("ERRR:", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listen on ${process.env.PORT}`);
        })

    } catch (error) {
       console.error("error", error);
       throw error; 
    }
})()
*/