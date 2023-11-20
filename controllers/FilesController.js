import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const FilesController = {
  async postUpload(req, res) {
    try {
      const { 'x-token': token } = req.headers;

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, type, parentId = 0, isPublic = false, data } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if ((type === 'file' || type === 'image') && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      if (parentId !== 0) {
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

      const fileData = {
        userId: dbClient.getObjectId(userId),
        name,
        type,
        isPublic,
        parentId: dbClient.getObjectId(parentId),
      };

      if (type === 'file' || type === 'image') {
        const fileUuid = uuidv4();
        const localPath = path.join(FOLDER_PATH, fileUuid);
        await fs.writeFile(localPath, Buffer.from(data, 'base64'));

        fileData.localPath = localPath;
      }

      const result = await dbClient.filesCollection.insertOne(fileData);
      const newFile = { id: result.insertedId.toString(), ...fileData };

      return res.status(201).json(newFile);
    } catch (error) {
      console.error(`Error in postUpload: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default FilesController;
