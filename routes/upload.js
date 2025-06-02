const router = require("express").Router();
const multer = require('multer');

// Use memory storage to access video buffer
const upload = multer({ storage: multer.memoryStorage() });

// Controllers
const { 
    uploadImages, 
    uploadVideo,
    // handleVideoChunks
} = require('../controllers/upload');

// ROUTES

// Image upload (memory)
router.post('/images', upload.array('images', 10), uploadImages);

// ✅ FIXED: Video upload (HLS via memory buffer)
router.post('/videos', upload.single('video'), uploadVideo);

// Optionally support chunked uploads later
// router.post('/video-chunks', fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }), handleVideoChunks);

module.exports = router;
