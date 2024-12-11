import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router();
router.use(verifyJWT);

router
    .route("/")
    .post(createTweet)

router
    .route("/getUserTweet")
    .get(getUserTweets)
    
router
    .route("/:tweetId")
    .patch(updateTweet)
    .delete(deleteTweet)


export default router;