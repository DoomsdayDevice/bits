import { Inject, Injectable } from '@nestjs/common';
import { MINIO_CONNECTION } from 'nestjs-minio';
import * as Minio from 'minio';
import { ItemBucketMetadata } from 'minio';
import { Readable } from 'stream';
import { MetaDataOptions } from './types';

@Injectable()
export class S3Service {
  constructor(@Inject(MINIO_CONNECTION) private readonly minioClient: Minio.Client) {}

  async removeObject(bucketName: string, objectName: string): Promise<void> {
    await this.minioClient.removeObject(bucketName, objectName);
  }

  async putObject(
    bucketName: string,
    objectName: string,
    stream: Readable | Buffer | string,
    metaData?: ItemBucketMetadata,
  ) {
    return this.minioClient.putObject(bucketName, objectName, stream, metaData);
  }

  /* Формирование метадаты из опций для отправки в хранилище */
  getMetaDataForFile(options: MetaDataOptions = {}): Minio.ItemBucketMetadata {
    const { mimetype, fileName } = options;
    const metaData: Minio.ItemBucketMetadata = {};
    if (mimetype) {
      metaData['Content-Type'] = mimetype;
    }
    if (fileName) {
      metaData['Content-Disposition'] = `attachment; filename="${encodeURIComponent(fileName)}"`;
    }
    return metaData;
  }
}
