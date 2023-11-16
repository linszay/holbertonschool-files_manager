const { checkRedisStatus, checkDBStatus, countUsers, countFiles } = require('../utils');

const AppController = {
  getStatus: async (req, res) => {
    try {
      const redisStatus = await checkRedisStatus();
      const dbStatus = await checkDBStatus();

      res.status(200).json({ redis: redisStatus, db: dbStatus });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getStats: async (req, res) => {
    try {
      const userCount = await countUsers();
      const fileCount = await countFiles();

      res.status(200).json({ users: userCount, files: fileCount });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

module.exports = AppController;
