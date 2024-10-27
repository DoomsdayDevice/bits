import * as cacheManager from "cache-manager";
import { CacheOptions } from "@type-cacheable/core/dist/interfaces";
import tcManager, { Cacheable } from "@type-cacheable/core";
import { RedisAdapter, useAdapter } from "@type-cacheable/redis-adapter";
import * as Redis from "redis";
import { Type } from "@nestjs/common";
import { CustomCacheStrategy } from "./cache-strategy";
import { RedisCache, redisStore } from "./cache-redis";

// TODO combine with cache for core and put into @bits
tcManager.setOptions({ debug: true });

type CacheCfg = {
  enabled: boolean;
  host: string;
  port: number;
  password: string;
};
export interface CacheMethodOpts extends CacheOptions {
  TransformModel?: Type<any>;
}

export const getCacheStuff = ({ enabled, host, port, password }) => {
  let redisCache: RedisCache;

  const redisClient = Redis.createClient({
    url: `redis://${host}:${port}`,
    password,
    // retry_strategy: enabled ? undefined : () => null,
  });

  let clientAdapter: RedisAdapter | null = null;
  redisClient.on("error", (error: any) => {
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

  const myCacheManager = {
    async set(key: string, payload: string) {
      redisCache = await cacheManager.caching(redisStore, {
        url: `redis://${host}:${port}`,
        socket: { connectTimeout: 50000 },
      });
      await redisCache.reset();
      await redisCache.set(key, payload);
    },

    async get(key: string) {
      return redisCache.get(key);
    },
  };

  function CacheMethod(opts: CacheMethodOpts = {}): MethodDecorator {
    if (clientAdapter && opts && !opts?.client) opts.client = clientAdapter;
    if (!opts.ttlSeconds) opts.ttlSeconds = 60 * 5;
    opts.strategy = new CustomCacheStrategy(opts.TransformModel);
    return Cacheable(opts) as MethodDecorator;
  }

  return {
    CacheMethod,
    myCacheManager,
    redisClient,
    clientAdapter,
  };
};
