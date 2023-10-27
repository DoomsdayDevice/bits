import { Global, Module } from "@nestjs/common";
import { NestMinioModule } from "nestjs-minio";
import { S3Service } from "./s3.service";
import { configFactory, S3Cfg, S3Config } from "./config";
import { ConfigModule } from "@bits/nestjs-config";

@Global()
@Module({
  providers: [S3Service],
  exports: [S3Service],
  imports: [
    NestMinioModule.registerAsync(S3Config),
    ConfigModule.forFeature(S3Cfg, configFactory),
  ],
})
export class S3Module {}
