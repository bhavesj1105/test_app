import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Simple in-memory catalog (could be moved to DB)
const STICKER_CDN_BASE = process.env.STICKER_CDN_BASE || 'https://cdn.example.com/stickers';
const CATEGORIES = [
  {
    id: 'reactions',
    title: 'Reactions',
    stickers: [
      { id: 'yay', url: `${STICKER_CDN_BASE}/reactions/yay.png` },
      { id: 'lol', url: `${STICKER_CDN_BASE}/reactions/lol.png` },
      { id: 'shock', url: `${STICKER_CDN_BASE}/reactions/shock.png` },
    ],
  },
  {
    id: 'memes',
    title: 'Memes',
    stickers: [
      { id: 'doge', url: `${STICKER_CDN_BASE}/memes/doge.png` },
      { id: 'distracted', url: `${STICKER_CDN_BASE}/memes/distracted.png` },
    ],
  },
];

router.get('/', (_req, res: Response) => {
  res.json({ categories: CATEGORIES });
});

// Upload custom stickers (admin only or moderated)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = process.env.STICKERS_UPLOAD_PATH || './uploads/stickers';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'sticker-' + unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') }, // 5MB default
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

router.post('/upload', authenticate, upload.single('sticker'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = (user as any).role === 'admin' || process.env.ALLOW_CUSTOM_STICKERS === 'true';
    if (!isAdmin) {
      res.status(403).json({ error: 'Not authorized to upload stickers' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const publicBase = process.env.STICKERS_PUBLIC_BASE || `${process.env.SERVER_PUBLIC_URL || ''}/uploads/stickers`;
    const url = `${publicBase}/${req.file.filename}`.replace(/\/+/, '/');
    res.status(201).json({ success: true, sticker: { id: req.file.filename, url } });
  } catch (e: any) {
    console.error('Sticker upload error:', e);
    res.status(500).json({ error: 'Failed to upload sticker' });
  }
});

export default router;
