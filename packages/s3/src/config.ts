import { NestMinioOptions } from "nestjs-minio";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";
import assert from "assert";

export class S3Cfg {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsString()
  endPoint!: string;

  @IsString()
  accessKey!: string;

  @IsString()
  secretKey!: string;

  @IsBoolean()
  useSSL!: boolean;

  @IsOptional()
  @IsNumber()
  port?: number;

  @IsString()
  bucketName!: string;
}

type Opts = { https: boolean };

export const configFactory = () => {
  assert(process.env.S3_URL);
  const url = new URL(process.env.S3_URL);
  const useSSL = process.env.S3_USE_SSL;
  const cfg: S3Cfg = {
    url: url.toString(),
    endPoint: url.hostname,
    accessKey: url.username,
    secretKey: url.password,
    useSSL:  useSSL == undefined ? true : (useSSL === 'true'),
    port: +url.port,
    bucketName: process.env.S3_BUCKET_NAME! || "test",
  };

  return cfg;
};

export const S3Config: any = {
  inject: [S3Cfg],
  useFactory: (cfg: S3Cfg): NestMinioOptions => ({
    endPoint: cfg.endPoint,
    port: cfg.port,
    useSSL: cfg.useSSL,
    accessKey: cfg.accessKey,
    secretKey: cfg.secretKey,
  }),
};
