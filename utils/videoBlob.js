const fs = require('fs');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports.uploadToAzure = async (folderPath, containerName, folderName) => {
    console.log("🪣 Container name:", containerName);
    const connectionString = process.env.AZURE_CONNECTION_STRING;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9-_.\/]/g, '_');
    const safeFolderName = sanitizeName(folderName);

    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const sanitizedFile = sanitizeName(file);
        const blobName = `${safeFolderName}/${sanitizedFile}`.replace(/\\/g, '/');

        console.log("📦 Uploading:", blobName);

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const fileStream = fs.createReadStream(filePath);

        await blockBlobClient.uploadStream(fileStream);
    }

    return `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/${safeFolderName}/index.m3u8`;
};
