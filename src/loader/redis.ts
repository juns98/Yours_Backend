import * as redis from 'redis';
import config from '../config';

//* Redis 연결
const redisClient = redis.createClient({
  url: `redis://${config.redisUserName}:${config.redisPassword}@${config.redisHost}:${config.redisPort}/0`,
  legacyMode: true,
});

const connectRedis = async () => {
  redisClient.on('connect', () => {
    console.info('Redis connected');
  });
  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });
  redisClient.connect().then();
};

const redisCli = redisClient.v4;

export { connectRedis, redisCli };
