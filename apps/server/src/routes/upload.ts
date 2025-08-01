import { Router } from 'express'
import multer from 'multer'
import { uploadFile } from '../lib/minio.js'

const router = Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed') as any, false)
    }
  }
})

// Upload image endpoint
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    const imageUrl = await uploadFile(req.file, 'images')

    res.json({
      success: true,
      data: {
        url: imageUrl,
        fileName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    })
  } catch (error) {
    console.error('Image upload error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    })
  }
})

// EditorJS image upload endpoint
router.post('/upload-image-editorjs', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: 0,
        error: 'No image file provided'
      })
    }

    const imageUrl = await uploadFile(req.file, 'images')

    // EditorJS expects specific response format
    res.json({
      success: 1,
      file: {
        url: imageUrl
      }
    })
  } catch (error) {
    console.error('EditorJS image upload error:', error)
    res.status(500).json({
      success: 0,
      error: 'Failed to upload image'
    })
  }
})

export default router
