import { OPENAI_OPTIONS_TOKEN } from "./constants";
import type { OpenAIModel } from "./types";
import { OpenAIModuleOptions } from "./types";

import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import OpenAI from "openai";
import type { APIPromise, Uploadable } from "openai/core";
import type { ChatCompletionChunk } from "openai/resources";
import type { Stream } from "openai/streaming";
import { ChatRole } from "./enums";

@Injectable()
export class OpenAiService {
  private readonly client: OpenAI;
  private model: OpenAIModel = "gpt-4-turbo-preview";

  constructor(
    @Inject(OPENAI_OPTIONS_TOKEN) private readonly options: OpenAIModuleOptions
  ) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
    });
  }

  async ask(systemPrompt: string, prompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: ChatRole.SYSTEM,
            content: systemPrompt,
          },
          {
            role: ChatRole.USER,
            content: prompt,
          },
        ],
        temperature: 1,
      });
      return completion.choices[0].message.content ?? "";
    } catch (e) {
      console.error(e);
      throw new BadRequestException("OpenAi can not create a chat");
    }
  }

  /**
   * @param systemPrompt
   * @param image BASE64
   */
  async askWithImages(systemPrompt: string, images: string[]): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: ChatRole.SYSTEM,
            content: systemPrompt,
          },
          {
            role: ChatRole.USER,
            content: images.map((image) => ({
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
                detail: "high",
              },
            })),
          },
        ],
        temperature: 1,
      });
      return completion.choices[0].message.content ?? "";
    } catch (e) {
      console.error(e);
      throw new BadRequestException("OpenAi can not create a chat");
    }
  }

  askStream(content: string): APIPromise<Stream<ChatCompletionChunk>> {
    try {
      return this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: ChatRole.USER,
            content,
          },
        ],
        temperature: 1,
        stream: true,
      });
    } catch (e) {
      console.error(e);
      throw new BadRequestException("OpenAi can not create a stream chat");
    }
  }

  async getTranscription(file: Uploadable): Promise<string> {
    const response = await this.client.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    console.log("Transcription finished: ", response.text);
    return response.text;
  }

  async textToSpeech(input: string): Promise<Buffer> {
    const mp3 = (await this.client.audio.speech.create({
      voice: "nova",
      input,
      model: "tts-1",
    })) as any; // TODO why never??

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return buffer;
  }

  async createImage(prompt: string): Promise<string> {
    console.log("creating image");
    const response = await this.client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });
    console.log("created image");
    if (!response.data[0].url) {
      throw new Error("Something went wrong");
    }
    return response.data[0].url;
  }

  async editImage(
    image: Uploadable,
    mask: Uploadable,
    prompt: string
  ): Promise<string> {
    const response = await this.client.images.edit({
      model: "dall-e-2",
      image,
      mask,
      prompt,
      n: 1,
      size: "1024x1024",
    });
    if (!response.data[0].url) {
      throw new Error("Something went wrong");
    }
    return response.data[0].url;
  }
}
