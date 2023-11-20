import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import mimeTypes from 'mime-types';
import { createQueue, addJob } from '../utils/queue';
import sharp from 'sharp';

const fileQueue = createQueue('fileQueue');
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const FilesController = {
  async postUpload(req, res) {
    try {
      const { name, type, data, parentId, isPublic } = req.body;
      const { userId } = req;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      let localPath;

      if (parentId) {
        const parentFile = await dbClient.filesCollection.findOne({
          _id: dbClient.getObjectId(parentId),
        });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      if (type === 'folder') {
        const newFile = await dbClient.filesCollection.insertOne({
          userId: dbClient.getObjectId(userId),
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentId || 0,
        });

        return res.status(201).json(newFile.ops[0]);
      } else {
        localPath = path.join(FOLDER_PATH, uuidv4());

        await fs.writeFile(localPath, Buffer.from(data, 'base64'));
      }

      const newFile = await dbClient.filesCollection.insertOne({
        userId: dbClient.getObjectId(userId),
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || 0,
        localPath,
      });

      // Add a job to the queue for generating thumbnails
      addJob(fileQueue, { userId, fileId: newFile.ops[0]._id });

      return res.status(201).json(newFile.ops[0]);
    } catch (error) {
      console.error(`Error in postUpload: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getFile(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req;

      const file = await dbClient.filesCollection.findOne({
        _id: dbClient.getObjectId(id),
      });

      if (!file || (file.isPublic === false && file.userId.toString() !== userId)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const { localPath, name, type } = file;

      // Check if the size query parameter is present
      const size = req.query.size;
      if (size) {
        const thumbnailPath = path.join(FOLDER_PATH, `${id}_${size}`);
        await sharp(localPath).resize(Number(size)).toFile(thumbnailPath);
        const thumbnailContent = await fs.readFile(thumbnailPath);
        res.status(200).send(thumbnailContent);
        return;
      }

      // Get the MIME-type based on the name of the file
      const mimeType = mimeTypes.lookup(name) || 'application/octet-stream';

      // Return the content of the file with the correct MIME-type
      const fileContent = await fs.promises.readFile(localPath, { encoding: 'utf-8' });
      res.setHeader('Content-Type', mimeType);
      res.status(200).send(fileContent);
    } catch (error) {
      console.error(`Error in getFile: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getIndex(req, res) {
    // ... (implementation for GET /files)
  },

  async getShow(req, res) {
    // ... (implementation for GET /files/:id)
  },

  async putPublish(req, res) {
    // ... (implementation for PUT /files/:id/publish)
  },

  async putUnpublish(req, res) {
    // ... (implementation for PUT /files/:id/unpublish)
  },
};

export default FilesController;
