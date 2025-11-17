import {
  createClient,
  createCluster,
  RedisClientOptions,
  RedisClientType,
  RedisClusterOptions,
  RedisClusterType,
} from "redis";
import "@redis/client";
import "@redis/bloom";
import "@redis/graph";
import "@redis/json";
import "@redis/search";
import "@redis/time-series";

import type { Cache, CacheManagerStore, CreateCacheOptions } from "cache-manager";

type Clients = RedisClientType | RedisClusterType;

export type RedisCache<T extends Clients = RedisClientType> = Cache;

type Name<T extends Clients> = T extends RedisClientType
  ? "redis"
  : T extends RedisClusterType
  ? "redis-cluster"
  : never;

export interface RedisStore<T extends Clients = RedisClientType> extends CacheManagerStore {
  name: Name<T>;
  isCacheable: (value: unknown) => boolean;
  get client(): T;
}

const getVal = (value: unknown) => JSON.stringify(value) || '"undefined"';

function builder<T extends Clients>(
  redisCache: T,
  name: Name<T>,
  reset: () => Promise<void>,
  keys: (pattern: string) => Promise<string[]>,
  options?: { isCacheable?: (value: unknown) => boolean; ttl?: number }
) {
  const isCacheable =
    options?.isCacheable || ((value) => value !== undefined && value !== null);

  return {
    async get<T>(key: string) {
      const val = await redisCache.get(key);
      if (val === undefined || val === null) return undefined;
      else return JSON.parse(val) as T;
    },
    async set(key, value, ttl) {
      if (!isCacheable(value))
        throw new Error(`"${value}" is not a cacheable value`);
      const t = ttl === undefined ? options?.ttl : ttl;
      const ttlOptions = t !== undefined ? { PX: t } : undefined;
      await redisCache.set(key, getVal(value), ttlOptions);
    },
    async mset(args: Record<string, any>, ttl) {
      const t = ttl === undefined ? options?.ttl : ttl;
      if (t !== undefined) {
        const multi = redisCache.multi();
        for (const [key, value] of Object.entries(args)) {
          if (!isCacheable(value))
            throw new Error(`"${getVal(value)}" is not a cacheable value`);
          multi.set(key, getVal(value), { PX: t });
        }
        await multi.exec();
      } else {
        const entries = Object.entries(args).map(([key, value]) => {
          if (!isCacheable(value))
            throw new Error(`"${getVal(value)}" is not a cacheable value`);
          return [key, getVal(value)] as [string, string];
        });
        await redisCache.mSet(Object.fromEntries(entries));
      }
    },
    mget: (...args) =>
      redisCache
        .mGet(args)
        .then((x) =>
          x.map((x) =>
            x === null || x === undefined
              ? undefined
              : (JSON.parse(x) as unknown)
          )
        ),
    async mdel(...args) {
      await redisCache.del(args);
    },
    async del(key) {
      await redisCache.del(key);
    },
    ttl: async (key) => redisCache.pTTL(key),
    keys: (pattern = "*") => keys(pattern),
    reset,
    isCacheable,
    name,
    get client() {
      return redisCache;
    },
  } as RedisStore<T>;
}

// TODO: past instance as option
export async function redisStore(options?: RedisClientOptions & { isCacheable?: (value: unknown) => boolean; ttl?: number }) {
  const redisCache = createClient(options);
  await redisCache.connect();

  return redisInsStore(redisCache as RedisClientType, options);
}

/**
 * redisCache should be connected
 */
export function redisInsStore(redisCache: RedisClientType, options?: { isCacheable?: (value: unknown) => boolean; ttl?: number }) {
  const reset = async () => {
    await redisCache.flushDb();
  };
  const keys = (pattern: string) => redisCache.keys(pattern);

  return builder(redisCache, "redis", reset, keys, options);
}

// TODO: coverage
export async function redisClusterStore(options: RedisClusterOptions & { isCacheable?: (value: unknown) => boolean; ttl?: number }) {
  const redisCache = createCluster(options);
  await redisCache.connect();

  return redisClusterInsStore(redisCache as any, options);
}

// TODO: coverage
/**
 * redisCache should be connected
 */
export function redisClusterInsStore(
  redisCache: RedisClusterType,
  options: { isCacheable?: (value: unknown) => boolean; ttl?: number }
) {
  const reset = async () => {
    await Promise.all(
      redisCache
        .getMasters()
        .map(async (node) => (await node.client)?.flushDb())
    );
  };

  const keys = async (pattern: string) => {
    const masters = redisCache.getMasters().map((node) => node.client);
    const clients = (await Promise.all(masters)).filter((c) => c);

    return (await Promise.all(clients.map((c) => c!.keys(pattern)))).flat();
  };

  return builder(redisCache, "redis-cluster", reset, keys, options);
}
