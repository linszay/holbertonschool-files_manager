import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  // new class to create a new client
  constructor() {
    // creating a new client
    this.client = redis.createClient();

    // handling errors
    this.client.on('error', (error) => {
      console.error(`Redis client error: ${error}`);
    });
  }

  isAlive() {
    // checking if client is connected
    return this.client.connected;
  }

  async get(key) {
    // func takes a string key and returns redis value
    const getAsync = promisify(this.client.get).bind(this.client);
    // using promisify to take a func and return a new func
    // the new func returns a promise asynchronously
    try {
      const value = await getAsync(key);
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error getting value from Redis: ${error}`);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      const setAsync = promisify(this.client.set).bind(this.client);
      // using promisify again for the same reason but for set
      await setAsync(key, JSON.stringify(value), 'EX', duration);
      // await the promise to return/set the value
    } catch (error) {
      console.error(`Error setting value in Redis: ${error}`);
    }
  }

  async del(key) {
    try {
      const delAsync = promisify(this.client.del).bind(this.client);
      // same use with promisify again but for del
      await delAsync(key);
      // await the promise to return/del the value
    } catch (error) {
      console.error(`Error deleting value from Redis: ${error}`);
    }
  }
}

const redisClient = new RedisClient();

module.export = redisClient;
