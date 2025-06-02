const { sanitizeBlobName } = require("../utils/sanitizeBlob");
const { BlobServiceClient } = require("@azure/storage-blob");
const { fork } = require('child_process');
const path = require('path');

// Upload image to Azure Blob Storage
module.exports.uploadImage = async (containerName, file) => {
  try {
    const connectionString = process.env.AZURE_CONNECTION_STRING;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blobName = `${Date.now()}_${sanitizeBlobName(file.originalname)}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(file.buffer, file.buffer.length);

    return { url: blockBlobClient.url };
  } catch (error) {
    return { errors: error };
  }
};

// Upload multiple images
module.exports.uploadImages = async (containerName, files) => {
  try {
    const connectionString = process.env.AZURE_CONNECTION_STRING;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    let uploadedFiles = [];

    for (let file of files) {
      const blobName = `${Date.now()}_${Math.random().toString().substr(2, 8)}_${sanitizeBlobName(file.originalname)}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(file.buffer, file.buffer.length);
      uploadedFiles.push(blockBlobClient.url);
    }

    return uploadedFiles;
  } catch (error) {
    return { errors: error };
  }
};

// Upload HLS video
module.exports.uploadVideo = (containerName, file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject({ statusCode: 400, message: 'Invalid video file.' });
    }

    const videoFile = {
      buffer: file.buffer.toString('base64'), // ENCODE
      originalname: file.originalname || `upload_${Date.now()}.mp4`
    };

    // ✅ Add this log:
    console.log('👀 Sending to worker:', {
      isBuffer: Buffer.isBuffer(videoFile.buffer),
      size: videoFile.buffer.length,
      name: videoFile.originalname
    });

    const worker = fork(path.join(__dirname, '..', 'Workers', 'videoProcessor.js'));

    worker.on('message', (message) => {
      resolve({ statusCode: message.statusCode, message: message.text, url: message.url });
    });

    worker.on('error', err => {
      console.error('Worker error:', err);
      reject({ statusCode: 500, message: 'Failed to process video.' });
    });

    worker.send({ video: videoFile, containerName: 'videos' }); // 🔒 Hardcoded and safe
  });
};

