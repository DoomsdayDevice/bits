import * as cacheManager from 'cache-manager';
import { CacheOptions } from '@type-cacheable/core/dist/interfaces';
import tcManager, { Cacheable } from '@type-cacheable/core';
import { RedisAdapter, useAdapter } from '@type-cacheable/redis-adapter';
import * as Redis from 'redis';
import { Type } from '@nestjs/common';
import { promisify } from 'util';
import { CustomCacheStrategy } from './cache-strategy';
import cfgFunc from 'config';
import { RedisCache, redisStore } from './cache-redis';

const cfg = cfgFunc();
// TODO combine with cache for core and put into @bits
tcManager.setOptions({ debug: true });

let redisCache: RedisCache;
let customRedisCache: RedisCache;

export const myCacheManager = {
  async set(key: string, payload: string) {
    redisCache = await cacheManager.caching(redisStore, {
      url: `redis://${cfg.redis.host}:${cfg.redis.port}`,
    });
    await redisCache.reset();
    await redisCache.set(key, payload);
  },

  async get(key: string) {
    return redisCache.get(key);
  },
};

const { enabled, host, port, password } = cfg.redis;

export const syncClient = Redis.createClient({
  url: `redis://${host}:${port}`,
  password,
  // retry_strategy: enabled ? undefined : () => null,
});

export let clientAdapter: RedisAdapter;
syncClient.on('error', (error: any) => {
  // eslint-disable-next-line no-console
  if (enabled) console.error(error);
});

if (enabled) {
  syncClient.connect().then(async () => {
    await syncClient.flushAll();
    clientAdapter = useAdapter(syncClient as any);
    // eslint-disable-next-line no-console
  });
}

export const redisClient = {
  get: promisify(syncClient.get).bind(syncClient),
  set: promisify(syncClient.set).bind(syncClient),
  hGet: promisify(syncClient.hGet).bind(syncClient),
  hGetAll: promisify(syncClient.hGetAll).bind(syncClient),
  hIncrBy: promisify(syncClient.hIncrBy).bind(syncClient),
  hSet: promisify(syncClient.hSet).bind(syncClient),
  expire: promisify(syncClient.expire).bind(syncClient),
  flushAll: promisify(syncClient.flushAll).bind(syncClient),
};

interface CacheMethodOpts extends CacheOptions {
  TransformModel?: Type<any>;
}

export function CacheMethod(opts: CacheMethodOpts = {}): MethodDecorator {
  if (opts && !opts?.client) opts.client = clientAdapter;
  if (!opts.ttlSeconds) opts.ttlSeconds = 60 * 5;
  opts.strategy = new CustomCacheStrategy(opts.TransformModel);
  return (() => () => () => {}) as any;
  // return Cacheable(opts) as MethodDecorator;
}
