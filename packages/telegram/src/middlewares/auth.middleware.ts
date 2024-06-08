import { UserLanguage } from '../enums';
import type { TgContext } from '../interfaces';

import type { Middleware } from 'telegraf';

export const authMiddleware: (
  userService: any,
) => Middleware<TgContext> = (userService) => async (ctx, next) => {
  let user = ctx.message?.from || (ctx?.callbackQuery?.message as any).from;
  if (user.is_bot) {
    user = (ctx.update as any).callback_query.from;
  }
  const {
    username,
    id: telegramId,
    first_name: firstName,
    last_name: lastName,
    language_code: langCode,
    is_bot: isBot,
  } = user;
  console.log(`User ${username} authorized`);

  const foundUser = await userService.findOneBy({ telegramId });
  if (foundUser) {
    ctx.state.user = foundUser;
  } else {
    ctx.state.user = await userService.save({
      username,
      telegramId,
      firstName,
      language: UserLanguage.RU,
    });
    console.log(`Created new user: ${JSON.stringify(ctx.state.user)}`);
  }
  await next();
};
