/**
 * Unified file storage — Vercel Blob (default) or AWS S3.
 * Set STORAGE_PROVIDER="s3" in env to switch to S3.
 * Both provide the same interface: { url, provider, key }
 */
import { put, del } from '@vercel/blob'

type UploadResult = {
  url: string
  provider: 'blob' | 's3'
  key: string
}

export async function uploadFile(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  const provider = (process.env.STORAGE_PROVIDER ?? 'blob') as 'blob' | 's3'

  if (provider === 's3') {
    return uploadToS3(file, filename, contentType)
  }
  return uploadToBlob(file, filename, contentType)
}

async function uploadToBlob(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  const blob = await put(`documents/${Date.now()}-${filename}`, file, {
    access: 'public',
    contentType,
  })
  return { url: blob.url, provider: 'blob', key: blob.pathname }
}

async function uploadToS3(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  // Lazy import so the package only loads when S3 is configured
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region:      process.env.AWS_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
  const key = `documents/${Date.now()}-${filename}`
  await client.send(new PutObjectCommand({
    Bucket:      process.env.AWS_S3_BUCKET!,
    Key:         key,
    Body:        file,
    ContentType: contentType,
  }))
  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${key}`
  return { url, provider: 's3', key }
}

export async function deleteFile(key: string, provider: 'blob' | 's3') {
  if (provider === 's3') {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' })
    await client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }))
  } else {
    await del(key)
  }
}
