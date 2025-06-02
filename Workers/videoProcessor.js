const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const { uploadToAzure } = require("../utils/videoBlob");

process.on("message", async ({ video, containerName }) => {
  const timestamp = Date.now();
  const tempBase = path.join(os.tmpdir(), `video_${timestamp}`);
  const filename = video.originalname || `upload_${timestamp}.mp4`;
  const inputPath = path.join(tempBase, filename);
  const outputDir = `${tempBase}_hls`;

  try {
    // 🔐 Decode base64 buffer from parent process
    const bufferDecoded = Buffer.from(video.buffer, 'base64');
    if (!bufferDecoded || !Buffer.isBuffer(bufferDecoded)) {
      console.error("❌ Invalid decoded video buffer");
      return process.send({ statusCode: 400, text: "Invalid video data" });
    }

    fs.mkdirSync(tempBase, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(inputPath, bufferDecoded);

    // 🎞️ Use full-featured FFmpeg HLS command (just like your Python version)
    const hlsCommand = `ffmpeg -i "${inputPath}" \
      -c:v libx264 -preset veryfast -crf 23 \
      -c:a aac -b:a 128k -ac 2 \
      -g 60 -keyint_min 60 -sc_threshold 0 \
      -hls_time 2 -hls_list_size 0 \
      -hls_segment_filename "${path.join(outputDir, "index%d.ts")}" \
      -f hls "${path.join(outputDir, "index.m3u8")}"`;

    exec(hlsCommand, { shell: true }, async (error) => {
      if (error) {
        console.error("❌ FFmpeg error:", error.message);
        return process.send({ statusCode: 500, text: "FFmpeg conversion failed" });
      }

      const { ObjectId } = require('mongodb');
      const folderName = `videos_new/${new ObjectId().toString()}`;

      console.log("📁 Uploading folder with name:", folderName);
      const url = await uploadToAzure(outputDir, containerName, folderName);

      process.send({
        statusCode: 200,
        text: "HLS video uploaded successfully",
        url,
      });
    });
  } catch (err) {
    console.error("❌ Processing error:", err);
    process.send({ statusCode: 500, text: "Video processing error" });
  }
});
