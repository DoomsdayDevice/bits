import { Inject, Injectable } from "@nestjs/common";
import { MINIO_CONNECTION } from "nestjs-minio";
import * as Minio from "minio";
import { ItemBucketMetadata } from "minio";
import { Readable } from "stream";
import { MetaDataOptions } from "./types";
import parse from "parse-duration";
import assert from "assert";
import { S3Cfg } from "./config";

@Injectable()
export class S3Service {
  constructor(
    @Inject(MINIO_CONNECTION) private readonly minioClient: Minio.Client,
    private cfg: S3Cfg
  ) {}

  async removeObject(bucketName: string, objectName: string): Promise<void> {
    await this.minioClient.removeObject(bucketName, objectName);
  }

  async putObject(
    bucketName: string,
    objectName: string,
    stream: Readable | Buffer | string,
    metaData?: ItemBucketMetadata
  ) {
    return this.minioClient.putObject(bucketName, objectName, stream, metaData);
  }

  /**
   *
   * @param bucketName
   * @param objectName
   * @param expiry example: '1d', '1w'
   */
  async getPresignedUrl(
    bucketName: string,
    objectName: string,
    expiry: string
  ) {
    const parsed = parse(expiry, "s");
    assert(parsed);
    return this.minioClient.presignedUrl("GET", bucketName, objectName, parsed);
  }

  async getStaticUrl(bucketName: string, objectName: string) {
    return `${this.cfg.protocol}//${
      this.cfg.endPoint + this.cfg.port ? `:${this.cfg.port}` : ""
    }/${bucketName}/public/${objectName}`;
  }

  /* Формирование метадаты из опций для отправки в хранилище */
  getMetaDataForFile(options: MetaDataOptions = {}): Minio.ItemBucketMetadata {
    const { mimetype, fileName } = options;
    const metaData: Minio.ItemBucketMetadata = {};
    if (mimetype) {
      metaData["Content-Type"] = mimetype;
    }
    if (fileName) {
      metaData[
        "Content-Disposition"
      ] = `attachment; filename="${encodeURIComponent(fileName)}"`;
    }
    return metaData;
  }
}
