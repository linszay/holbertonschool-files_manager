// mongodb intialization
const { MongoClient } = require('mongodb');

//  mongodb class
class DBClient {
  constructor() {
    this.db = null;
    this.users = null;
    this.connectMongo();
  }

  async connectMongo() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;

    try {
      this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
      await this.client.connect();
      this.db = this.client.db(database);
      this.users = this.db.collection('users');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB', error);
      this.db = false;
    }
  }

  async isAlive() {
    if (!this.client || !this.db) {
      return false;
    }
    try {
      await this.db.command({ ping: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // returns number of docs in collection users
  async nbUsers() {
    const db = this.client.db();
    const collection = db.collection('users');
    return collection.countDocuments();
  }

  // returns number of docs in collection files
  async nbFiles() {
    const db = this.client.db();
    const collection = db.collection('files');
    return collection.countDocuments();
  }
}

// create and export instance of DBClient
const dbClient = new DBClient();
module.exports = dbClient;
