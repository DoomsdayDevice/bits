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
  const cfg: S3Cfg = {
    url: url.toString(),
    endPoint: url.hostname,
    accessKey: url.username,
    secretKey: url.password,
    useSSL: true,
    port: +url.port,
    bucketName: process.env.S3_BUCKET_NAME! || "test",
  };
  console.dir({ cfg }, { depth: null });

  return cfg;
};
configFactory();

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
