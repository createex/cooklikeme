const router = require("express").Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const fileUpload = require('express-fileupload');

// Controllers
const { 
    uploadImages, 
    uploadVideo,
    // handleVideoChunks
} = require('../controllers/upload');

// Middlewares

router.post('/images', upload.array('images', 10), uploadImages);
router.post('/videos', fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }), uploadVideo);
// router.post('/video-chunks', fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }), handleVideoChunks);

module.exports = router;
