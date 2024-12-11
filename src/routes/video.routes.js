import { Router } from "express";
import { publishAVideo, updateVideo, getVideoById, deleteVideo, togglePublishStatus, getAllVideos } from '../controllers/video.controller.js'
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.use(verifyJWT);

router.route('/').post( 
    upload.fields([
        {
            name: "videofile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        }
    ]),
    publishAVideo
)
router
  .route('/:videoId')
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router
  .route('/toggelPublishStatus/:videoId')
  .patch(togglePublishStatus);

router
  .route('/')
  .get(getAllVideos)
export default router;
