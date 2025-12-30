import { Router } from 'express';
import { getDocuments, getDocument, uploadDocument, deleteDocument, downloadDocument } from '../controllers/documents.controller';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

router.use(authenticate);

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});

router.get('/', getDocuments);
router.get('/:id', getDocument);
router.post('/', upload.single('file'), uploadDocument);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

export default router;

