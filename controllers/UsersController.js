// controllers/UsersController.js
const sha1 = require('sha1');
const { hash } = require('crypto');
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
};

export default UsersController;
