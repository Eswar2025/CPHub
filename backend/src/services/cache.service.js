const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 300;
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
const memoryCache = new Map();

let redisClient = null;
let redisReady = false;
let initPromise = null;
let fallbackLogged = false;

async function init() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = connectRedis();
  return initPromise;
}

async function connectRedis() {
  try {
    const client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: false,
      },
    });

    client.on("error", () => {
      useMemoryFallback();
    });

    await client.connect();

    redisClient = client;
    redisReady = true;
    fallbackLogged = false;
    console.log("Redis connected. Using Redis cache.");
  } catch (error) {
    useMemoryFallback();
  }
}

async function get(key) {
  await init();

  if (redisReady && redisClient) {
    try {
      const value = await redisClient.get(getRedisKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      useMemoryFallback();
    }
  }

  return getFromMemory(key);
}

async function set(key, value) {
  await init();

  if (redisReady && redisClient) {
    try {
      await redisClient.setEx(getRedisKey(key), CACHE_TTL_SECONDS, JSON.stringify(value));
      return;
    } catch (error) {
      useMemoryFallback();
    }
  }

  setInMemory(key, value);
}

async function remove(key) {
  await init();

  if (redisReady && redisClient) {
    try {
      await redisClient.del(getRedisKey(key));
      return;
    } catch (error) {
      useMemoryFallback();
    }
  }

  memoryCache.delete(key);
}

function getProvider() {
  return redisReady ? "redis" : "memory";
}

function getRedisKey(key) {
  return `profile:${key}`;
}

function getFromMemory(key) {
  const entry = memoryCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value;
}

function setInMemory(key, value) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function useMemoryFallback() {
  redisReady = false;
  redisClient = null;

  if (!fallbackLogged) {
    console.log("Redis unavailable. Using in-memory cache fallback.");
    fallbackLogged = true;
  }
}

module.exports = {
  init,
  get,
  set,
  remove,
  getProvider,
};
