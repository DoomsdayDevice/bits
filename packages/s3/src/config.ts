import { NestMinioOptions } from "nestjs-minio";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";
import { validateConfig } from "@bits/backend/lib/config";

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

  dirs!: Record<string, string>;
}

type Opts = { https: boolean };

export const configFactory = ({ https = false }: Opts) => {
  const cfg: S3Cfg = {
    url: "",
    endPoint: process.env.S3_ENDPOINT!,
    accessKey: process.env.S3_ACCESS_KEY!,
    secretKey: process.env.S3_SECRET_KEY!,
    useSSL: true,
    port: process.env.S3_PORT ? +process.env.S3_PORT : undefined,
    bucketName: process.env.S3_BUCKET_NAME! || "test",
    dirs: { profilePictures: "images/profile-pictures" },
  };
  cfg.url = `http${https ? "s" : ""}://${cfg.endPoint}${
    cfg.port ? `:${cfg.port}` : ""
  }/${cfg.bucketName}`;

  validateConfig(S3Cfg, cfg);
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
