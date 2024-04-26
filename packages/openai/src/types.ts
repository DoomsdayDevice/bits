import type { OPENAI_MODELS } from "./constants";

import type { ModuleMetadata, Type } from "@nestjs/common";
import type { ChatCompletionMessageParam } from "openai/resources";

export type OpenAIModel = (typeof OPENAI_MODELS)[number];

export type AskOptions = {
  systemPrompt?: string;
  model?: OpenAIModel;
  messages?: ChatCompletionMessageParam[];

  /**
   * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
   * make the output more random, while lower values like 0.2 will make it more
   * focused and deterministic.
   *
   * We generally recommend altering this or `top_p` but not both.
   */
  temperature?: number;

  /**
   * Number between -2.0 and 2.0. Positive values penalize new tokens based on their
   * existing frequency in the text so far, decreasing the model's likelihood to
   * repeat the same line verbatim.
   *
   * [See more information about frequency and presence penalties.](https://platform.openai.com/docs/guides/text-generation/parameter-details)
   */
  frequencyPenalty?: number;

  /**
   * Number between -2.0 and 2.0. Positive values penalize new tokens based on
   * whether they appear in the text so far, increasing the model's likelihood to
   * talk about new topics.
   *
   * [See more information about frequency and presence penalties.](https://platform.openai.com/docs/guides/text-generation/parameter-details)
   */
  presencePenalty?: number;
};
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
