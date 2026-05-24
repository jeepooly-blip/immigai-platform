/**
 * AWS S3 helpers — used by storage.ts when STORAGE_PROVIDER=s3
 * Direct usage: prefer importing from @/lib/storage instead
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

export async function s3Upload(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const client = getS3Client()
  await client.send(new PutObjectCommand({
    Bucket:      process.env.AWS_S3_BUCKET!,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }))
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${key}`
}

export async function s3Delete(key: string): Promise<void> {
  const client = getS3Client()
  await client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }))
}

export async function s3PresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client()
  const command = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key })
  return getSignedUrl(client, command, { expiresIn })
}
