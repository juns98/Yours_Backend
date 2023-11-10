import { S3Client } from '@aws-sdk/client-s3';
import S3 from 'aws-sdk/clients/s3';
import config from '.';

const s3: S3Client = new S3Client({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: config.s3AccessKey,
    secretAccessKey: config.s3SecretKey,
  },
});

const s3ForConvertFile: S3 = new S3({
  region: 'ap-northeast-2',
  accessKeyId: config.s3AccessKey,
  secretAccessKey: config.s3SecretKey,
});
export { s3, s3ForConvertFile };
