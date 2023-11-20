// controllers/UsersController.js

const { hash } = require('crypto');
const dbClient = require('../db');

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
      const hashedPassword = hash('sha1').update(password).digest('hex');

      // create new user
      const newUser = {
        email,
        password: hashedPassword,
      };

      // save user to db
      await dbClient
        .client
        .db()
        .collection('users')
        .insertOne(newUser);

      // return new user with only email and id
      return res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default UsersController;
