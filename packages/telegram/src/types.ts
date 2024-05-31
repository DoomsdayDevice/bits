import type {
    TelegrafModuleAsyncOptions,
    TelegrafModuleOptions,
  } from 'nestjs-telegraf';

export interface TelegramModuleOptions extends TelegrafModuleOptions {
  botName: string;
  botToken: string;
}

export interface TelegramModuleAsyncOptions<
  T extends { telegramId: string } = any,
> extends TelegrafModuleAsyncOptions {
  botName: string;
  botToken: string;
  userService: T;
  errorCb: (ctx: any) => any;
  authCb?: (ctx: any) => any;
}
