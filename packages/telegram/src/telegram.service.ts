import { TG_OPTIONS_TOKEN } from './constants';
import { TelegramModuleAsyncOptions } from './types';

import { Inject, Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { Telegraf } from 'telegraf';

export abstract class TelegramService {
  bot!: Telegraf<Context>;
}

export const getTelegramService = (tgBotName: string): any => {
  @Injectable()
  class TelegramService {
    constructor(
      @InjectBot(tgBotName) public bot: Telegraf<Context>,
      @Inject(TG_OPTIONS_TOKEN)
      private readonly options: TelegramModuleAsyncOptions,
    ) {}
  }

  return TelegramService;
};
