import * as Minio from 'minio'

// Bucket name for uploads
export const UPLOADS_BUCKET = 'lap-cms-uploads'

// Lazy initialization of Minio client
let _minioClient: Minio.Client | null = null

function getMinioClient(): Minio.Client {
  if (!_minioClient) {
    // Parse upload URL to get endpoint and SSL info
    const uploadUrl = process.env.UPLOAD_URL || 'http://localhost:9000'
    const parsedUrl = new URL(uploadUrl)

    // Minio client configuration using UPLOAD_ environment variables
    _minioClient = new Minio.Client({
      endPoint: parsedUrl.hostname,
      port: parsedUrl.port ? parseInt(parsedUrl.port) : (parsedUrl.protocol === 'https:' ? 443 : 80),
      useSSL: parsedUrl.protocol === 'https:',
      accessKey: process.env.UPLOAD_KEY || 'minioadmin',
      secretKey: process.env.UPLOAD_SECRET || 'minioadmin'
    })

    console.log(`🔧 Minio configured for: ${uploadUrl}`)
  }
  
  return _minioClient
}

// Initialize bucket if it doesn't exist
export async function initializeBucket() {
  try {
    const client = getMinioClient()
    const bucketExists = await client.bucketExists(UPLOADS_BUCKET)
    if (!bucketExists) {
      await client.makeBucket(UPLOADS_BUCKET)
      console.log(`✅ Bucket ${UPLOADS_BUCKET} created successfully`)
      
      // Set bucket policy to allow public read access for images
      const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${UPLOADS_BUCKET}/images/*`]
          }
        ]
      }
      
      await client.setBucketPolicy(UPLOADS_BUCKET, JSON.stringify(bucketPolicy))
      console.log(`✅ Bucket policy set for ${UPLOADS_BUCKET}`)
    } else {
      console.log(`✅ Bucket ${UPLOADS_BUCKET} already exists`)
    }
  } catch (error) {
    // In production, the bucket might exist but we don't have management permissions
    if (error instanceof Error && error.message.includes('AccessDenied')) {
      console.log(`ℹ️  Bucket ${UPLOADS_BUCKET} exists (no management permissions required)`)
    } else {
      console.error('❌ Error initializing Minio bucket:', error)
    }
  }
}

// Upload file to Minio
export async function uploadFile(
  file: Express.Multer.File,
  folder: string = 'images'
): Promise<string> {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`
  const client = getMinioClient()
  
  await client.putObject(
    UPLOADS_BUCKET,
    fileName,
    file.buffer,
    file.size,
    {
      'Content-Type': file.mimetype
    }
  )
  
  // Return the public URL using UPLOAD_URL
  const uploadUrl = process.env.UPLOAD_URL || 'http://localhost:9000'
  return `${uploadUrl}/${UPLOADS_BUCKET}/${fileName}`
}

// Delete file from Minio
export async function deleteFile(fileName: string): Promise<void> {
  const client = getMinioClient()
  await client.removeObject(UPLOADS_BUCKET, fileName)
}
