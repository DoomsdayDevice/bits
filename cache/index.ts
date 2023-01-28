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

export const redisClient = Redis.createClient({
  url: `redis://${host}:${port}`,
  password,
  // retry_strategy: enabled ? undefined : () => null,
});

export let clientAdapter: RedisAdapter;
redisClient.on('error', (error: any) => {
  // eslint-disable-next-line no-console
  if (enabled) console.error(error);
});

if (enabled) {
  redisClient.connect().then(async () => {
    // await redisClient.flushAll();
    clientAdapter = useAdapter(redisClient as any);
    // eslint-disable-next-line no-console
  });
}

interface CacheMethodOpts extends CacheOptions {
  TransformModel?: Type<any>;
}

export function CacheMethod(opts: CacheMethodOpts = {}): MethodDecorator {
  if (opts && !opts?.client) opts.client = clientAdapter;
  if (!opts.ttlSeconds) opts.ttlSeconds = 60 * 5;
  opts.strategy = new CustomCacheStrategy(opts.TransformModel);
  return Cacheable(opts) as MethodDecorator;
}
