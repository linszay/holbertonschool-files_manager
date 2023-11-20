// controllers/UsersController.js
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

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

    // check if x-token header is present
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // check if the user is authenticated based on the token
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // check if email already exists in db
      const existingUser = await dbClient
        .client
        .db()
        .collection('users')
        .findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // hash the password using SHA1
      const hashedPassword = sha1(password);

      // create a new user
      const newUser = {
        email,
        password: hashedPassword,
      };

      // save the user to the db
      const result = await dbClient
        .client
        .db()
        .collection('users')
        .insertOne(newUser);

      // return the new user with only email and id
      return res.status(201).json({ id: result.insertedId, email: newUser.email });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default UsersController;
