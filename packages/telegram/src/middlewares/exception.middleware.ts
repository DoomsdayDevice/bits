import type { TgContext } from '../interfaces';

import type { Middleware } from 'telegraf';

export const exceptionMiddleware: (cb: (ctx: any) => any) => Middleware<TgContext> =
  (cb) => async (ctx: any, next) => {
    try {
      await next();
    } catch (error) {
      console.error(error);
      await ctx.reply(
        'Что-то пошло не так 😞 ... Давайте попробуем ещё раз 🙏',
      );
      cb(ctx);
    }
  };
