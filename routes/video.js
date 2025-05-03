const express = require("express");
const router = express.Router();
const https = require("https");
const { PassThrough } = require("stream");

// Buffer the video file from Azure, then stream partial content
router.get("/:filename", (req, res) => {
  const filename = req.params.filename;
  const azureUrl = `https://cooklikeme2.blob.core.windows.net/videos/${filename}`;
  const range = req.headers.range;

  if (!range) {
    return res.status(416).send("Range header required for streaming");
  }

  https.get(azureUrl, (azureRes) => {
    let data = [];

    azureRes.on("data", (chunk) => {
      data.push(chunk);
    });

    azureRes.on("end", () => {
      const videoBuffer = Buffer.concat(data);
      const total = videoBuffer.length;

      // Parse the "bytes=start-end" Range header
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) {
        return res.status(416).send("Invalid Range header format.");
    }

      const start = parseInt(match[1], 10);
      let end = match[2] ? parseInt(match[2], 10) : total - 1;
      if (isNaN(end) || end >= total) {
        end = total - 1;
      }
      if (start >= total || end < start) {
        return res.status(416).send("Requested range not satisfiable");
      }

      const chunkSize = end - start + 1;
      const chunk = videoBuffer.slice(start, end + 1);

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      const stream = new PassThrough();
      stream.end(chunk);
      stream.pipe(res);
    });

    azureRes.on("error", (err) => {
      console.error("Azure download error:", err.message);
      res.status(500).send("Error downloading from Azure.");
    });
  }).on("error", (err) => {
    console.error("Azure fetch error:", err.message);
    res.status(500).send("Error fetching video from Azure.");
  });
});

module.exports = router;
