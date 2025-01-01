const fs = require('fs');
const path = require('path');

module.exports.mergeChunks = async (tempDir, fileName) => {
    const mergedFilePath = path.join(tempDir, `${fileName}.mp4`);
    const chunkFiles = fs.readdirSync(tempDir).sort((a, b) => {
        const aIndex = parseInt(a.split('_')[1], 10);
        const bIndex = parseInt(b.split('_')[1], 10);
        return aIndex - bIndex;
    });

    const writeStream = fs.createWriteStream(mergedFilePath);

    for (const chunkFile of chunkFiles) {
        const chunkPath = path.join(tempDir, chunkFile);
        const chunkData = fs.readFileSync(chunkPath);
        writeStream.write(chunkData);
        fs.unlinkSync(chunkPath);
    }

    writeStream.end();

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(mergedFilePath));
        writeStream.on('error', reject);
    });
};
