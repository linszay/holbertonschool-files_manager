// controllers/AppController.js
import { isAlive as isRedisAlive } from '../utils/redis';
import { isAlive as isDbAlive, countUsers, countFiles } from '../utils/db';

const AppController = {
  async getStatus(req, res) {
    try {
      const redisStatus = await isRedisAlive();
      const dbStatus = await isDbAlive();
      res.status(200).json({ redis: redisStatus, db: dbStatus });
    } catch (error) {
      console.error(`Error in getStatus: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getStats(req, res) {
    try {
      const usersCount = await countUsers();
      const filesCount = await countFiles();
      res.status(200).json({ users: usersCount, files: filesCount });
    } catch (error) {
      console.error(`Error in getStats: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

module.exports = AppController;
