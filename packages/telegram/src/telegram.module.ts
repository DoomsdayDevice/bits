import { TelegrafModule } from 'nestjs-telegraf';
import { TG_OPTIONS_TOKEN } from './constants';
import { TelegramService, getTelegramService } from './telegram.service';

import type { DynamicModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { TelegramModuleAsyncOptions, TelegramModuleOptions } from './types';
import { authMiddleware, exceptionMiddleware, sessionMiddleware } from './middlewares';

@Module({})
export class TelegramModule {
  public static forRoot(
    options: TelegramModuleOptions,
    connection?: string,
  ): DynamicModule {
    return {
      module: TelegramModule,
      providers: [
        {
          provide: TelegramService,
          useClass: getTelegramService(options.botName),
        },
      ],
      exports: [TelegramService],
    };
  }

  public static forRootAsync(
    options: TelegramModuleAsyncOptions,
    connection?: string,
  ): DynamicModule {
    return {
      module: TelegramModule,
      global: true,
      providers: [
        {
          provide: TelegramService,
          useClass: getTelegramService(options.botName),
        },  
        {
          provide: TG_OPTIONS_TOKEN,
          useFactory: options.useFactory!,
          inject: options.inject || []
        },
      ],
      exports: [TelegramService],
      imports: [
        TelegrafModule.forRootAsync({
          botName: options.botName,
          useFactory: async () => {
            return {
              token: options.botToken,
              middlewares: [
                exceptionMiddleware(options.errorCb),
                sessionMiddleware,
                authMiddleware(options.userService),
              ],
              include: [],
            };
          },
        }),
      
      ]
    };
  }
}
