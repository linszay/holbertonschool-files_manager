import { createWorker } from 'bull';
import imageThumbnail from 'image-thumbnail';
import path from 'path';
import fs from 'fs/promises';
import dbClient from './utils/db';

const fileQueue = createWorker('fileQueue');

fileQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

fileQueue.process(async (job) => {
  try {
    const { userId, fileId } = job.data;

    // Validate job data
    if (!userId || !fileId) {
      throw new Error('Missing userId or fileId');
    }

    // Check if the file document exists in DB
    const file = await dbClient.filesCollection.findOne({
      _id: dbClient.getObjectId(fileId),
      userId: dbClient.getObjectId(userId),
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Generate thumbnails
    const originalPath = file.localPath || path.join(FOLDER_PATH, uuidv4());
    const sizes = [500, 250, 100];

    for (const size of sizes) {
      const thumbnailPath = path.join(FOLDER_PATH, `${fileId}_${size}`);
      await imageThumbnail({
        source: originalPath,
        destination: thumbnailPath,
        width: size,
        responseType: 'base64',
      });
    }
  } catch (error) {
    console.error(`Error in fileQueue process: ${error}`);
    throw error;
  }
});

module.exports = fileQueue;
