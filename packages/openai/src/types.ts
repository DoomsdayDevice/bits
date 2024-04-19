import type { OPENAI_MODELS } from "./constants";

import type { ModuleMetadata, Type } from "@nestjs/common";

export type OpenAIModel = (typeof OPENAI_MODELS)[number];
export interface OpenAIModuleOptions {
  apiKey: string;
}

export interface OpenAIModuleOptionsFactory {
  createKnexModuleOptions(): Promise<OpenAIModuleOptions> | OpenAIModuleOptions;
}

export interface OpenAIModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  inject?: any[];
  useClass?: Type<OpenAIModuleOptionsFactory>;
  useExisting?: Type<OpenAIModuleOptionsFactory>;
  useFactory: (
    ...args: any[]
  ) => Promise<OpenAIModuleOptions> | OpenAIModuleOptions;
}

export type OpenAIVoice =
  | "alloy"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "shimmer";
