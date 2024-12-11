import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js"

const router = Router();
router.use(verifyJWT);

router
    .route('/c/:channelId')
    .post(toggleSubscription)
    .get(getUserChannelSubscribers)


router
    .route('/s/:subscriberId')
    .get(getSubscribedChannels)



export default router;