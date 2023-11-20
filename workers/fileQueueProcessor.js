import imageThumbnail from 'image-thumbnail';
import dbClient from '../utils/db';

// Processor function for the fileQueue
export async function fileQueueProcessor(job) {
  const { userId, fileId } = job.data;

  // Validate the presence of userId and fileId in the job
  if (!userId) {
    throw new Error('Missing userId');
  }
  if (!fileId) {
    throw new Error('Missing fileId');
  }

  // Retrieve the file document based on the fileId and userId
  const file = await dbClient.filesCollection.findOne({
    _id: dbClient.getObjectId(fileId),
    userId: dbClient.getObjectId(userId),
  });

  // Raise an error if no document is found
  if (!file) {
    throw new Error('File not found');
  }

  // Generate thumbnails with width = 500, 250, and 100
  const thumbnailSizes = [500, 250, 100];
  for (const size of thumbnailSizes) {
    const thumbnailPath = `${file.localPath}_${size}`;
    await imageThumbnail(file.localPath, { width: size, height: size, responseType: 'buffer' })
      .then((thumbnail) => {
        return dbClient.filesCollection.updateOne(
          { _id: dbClient.getObjectId(fileId) },
          {
            $set: {
              [`thumbnail_${size}`]: thumbnail.toString('base64'),
            },
          }
        );
      })
      .catch((error) => {
        console.error(`Error generating thumbnail for size ${size}: ${error}`);
      });
  }

  return 'Thumbnails generated successfully';
}
