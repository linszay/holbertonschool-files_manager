// controllers/FilesController.js
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid').v4;
const dbClient = require('../utils/db');

const { FOLDER_PATH } = process.env;

const FilesController = {
  postUpload: async (req, res) => {
    const { user, body } = req;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId, isPublic, data } = body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const parentFile = await dbClient
        .client
        .db()
        .collection('files')
        .findOne({ _id: parentId });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const newFile = {
      userId: user._id,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
    };

    if (type === 'folder') {
      const result = await dbClient
        .client
        .db()
        .collection('files')
        .insertOne(newFile);

      return res.status(201).json({ id: result.insertedId, ...newFile });
    }

    const localPath = path.join(FOLDER_PATH || '/tmp/files_manager', uuidv4());
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

    newFile.localPath = localPath;

    await dbClient
      .client
      .db()
      .collection('files')
      .insertOne(newFile);

    return res.status(201).json({ id: newFile._id, ...newFile });
  },
};

export default FilesController;
