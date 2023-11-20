// controllers/UsersController.js
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const UsersController = {
  postNew: async (req, res) => {
    const { email, password } = req.body;

    // check if email and password args are valid
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // check if email already exists in db
      const existingUser = await dbClient
        .client
        .db()
        .collection('users')
        .findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // hashing the password using SHA1
      const hashedPassword = sha1(password);

      // create new user
      const newUser = {
        email,
        password: hashedPassword,
      };

      // save user to db
      const result = await dbClient
        .client
        .db()
        .collection('users')
        .insertOne(newUser);

      // return new user with only email and id
      return res.status(201).json({ id: result.insertedId, email: newUser.email });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  getMe: async (req, res) => {
    const { 'x-token': token } = req.headers;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // retrieve user based on token
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // retrieve user details from MongoDB
      const user = await dbClient
        .client
        .db()
        .collection('users')
        .findOne({ _id: userId });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (user._id.toString() !== userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // return user object with email and id only
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default UsersController;
