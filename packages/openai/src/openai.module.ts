import { OPENAI_OPTIONS_TOKEN } from './constants';
import { OpenAiService } from './openai.service';
import type { OpenAIModuleAsyncOptions, OpenAIModuleOptions } from './types';

import type { DynamicModule } from '@nestjs/common';
import { Module } from '@nestjs/common';

@Module({})
export class OpenAIModule {
  public static forRoot(
    options: OpenAIModuleOptions,
    connection?: string,
  ): DynamicModule {
    return {
      module: OpenAIModule,
      providers: [OpenAiService],
      exports: [OpenAiService],
    };
  }

  public static forRootAsync(
    options: OpenAIModuleAsyncOptions,
    connection?: string,
  ): DynamicModule {
    return {
      module: OpenAIModule,
      global: true,
      providers: [
        OpenAiService,
        {
          provide: OPENAI_OPTIONS_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: [OpenAiService],
    };
  }
}
