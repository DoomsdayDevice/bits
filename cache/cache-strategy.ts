import { CacheStrategy, CacheStrategyContext } from '@type-cacheable/core';
import { plainToClass } from 'class-transformer';
import { Type } from '@nestjs/common';
/* eslint-disable no-console */

export class CustomCacheStrategy implements CacheStrategy {
  constructor(private TransformModel?: Type<any>) {}

  async handle(context: CacheStrategyContext): Promise<any> {
    try {
      const cachedValue = await context.client.get(context.key);

      // If a value for the cacheKey was found in cache, simply return that.
      if (cachedValue !== undefined && cachedValue !== null) {
        if (this.TransformModel)
          return plainToClass(this.TransformModel, cachedValue, { enableImplicitConversion: true });
        return cachedValue;
      }
    } catch (err: any) {
      if (context.fallbackClient) {
        try {
          const cachedValue = await context.fallbackClient.get(context.key);

          // If a value for the cacheKey was found in cache, simply return that.
          if (cachedValue !== undefined && cachedValue !== null) {
            return cachedValue;
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (context.debug) {
        console.warn(
          `type-cacheable Cacheable cache miss on method ${context.originalMethod.name} due to client error: ${err.message}`,
        );
      }
    }

    // On a cache miss, run the decorated method and cache its return value.
    const result = await context.originalMethod!.apply(
      context.originalMethodScope,
      context.originalMethodArgs,
    );

    try {
      await context.client.set(context.key, result, context.ttl);
    } catch (err: any) {
      if (context.fallbackClient) {
        try {
          await context.fallbackClient.set(context.key, result, context.ttl);
        } catch (e) {
          console.error(e);
        }
      }

      if (context.debug) {
        // eslint-disable-next-line no-console
        console.warn(
          `type-cacheable Cacheable set cache failure on method ${context.originalMethod.name} due to client error: ${err.message}`,
        );
      }
    }

    return result;
  }
}
