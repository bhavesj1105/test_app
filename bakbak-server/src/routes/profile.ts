import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { AppDataSource } from '../config/database';
import { User } from '../entities';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads/profiles');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /profile - Update user profile (protected route)
router.post('/', authenticate, upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'poster', maxCount: 1 }]), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
  const { name, bio, posterSvg, posterTheme } = req.body as any;
    const user = req.user!;

    const userRepository = AppDataSource.getRepository(User);

    // Update user data
    const updateData: Partial<User> = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    
    if (bio !== undefined) {
      updateData.bio = bio.trim();
    }

    // Handle profile picture upload
    const files = (req as any).files as { [field: string]: Express.Multer.File[] } | undefined;
    const profileFile = files?.profilePicture?.[0];
    const posterFile = files?.poster?.[0];
    if (profileFile) {
      updateData.profilePicture = `/uploads/profiles/${profileFile.filename}`;
    }
    if (posterFile) {
      updateData.posterUrl = `/uploads/profiles/${posterFile.filename}`;
    }

    if (posterSvg) {
      updateData.posterSvg = String(posterSvg);
    }
    if (posterTheme) {
      try { updateData.posterTheme = JSON.parse(posterTheme); } catch { /* ignore */ }
    }

    // Update user in database
    await userRepository.update(user.id, updateData);

    // Fetch updated user
    const updatedUser = await userRepository.findOne({
      where: { id: user.id },
    });

    res.json({
      success: true,
      user: {
        id: updatedUser!.id,
        countryCode: updatedUser!.countryCode,
        phone: updatedUser!.phone,
        name: updatedUser!.name,
        bio: updatedUser!.bio,
        profilePicture: updatedUser!.profilePicture,
        isVerified: updatedUser!.isVerified,
  posterUrl: updatedUser!.posterUrl,
  posterSvg: updatedUser!.posterSvg,
  posterTheme: updatedUser!.posterTheme,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /profile - Get current user profile (protected route)
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    res.json({
      success: true,
      user: {
        id: user.id,
        countryCode: user.countryCode,
        phone: user.phone,
        name: user.name,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /profile - Update specific profile fields (protected route)
router.put('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, bio } = req.body;
    const user = req.user!;

    const userRepository = AppDataSource.getRepository(User);
    const updateData: Partial<User> = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
        res.status(400).json({ error: 'Name must be between 1 and 100 characters' });
        return;
      }
      updateData.name = name.trim();
    }
    
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 500) {
        res.status(400).json({ error: 'Bio must be less than 500 characters' });
        return;
      }
      updateData.bio = bio.trim();
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    await userRepository.update(user.id, updateData);

    // Fetch updated user
    const updatedUser = await userRepository.findOne({
      where: { id: user.id },
    });

    res.json({
      success: true,
      user: {
        id: updatedUser!.id,
        countryCode: updatedUser!.countryCode,
        phone: updatedUser!.phone,
        name: updatedUser!.name,
        bio: updatedUser!.bio,
        profilePicture: updatedUser!.profilePicture,
        isVerified: updatedUser!.isVerified,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
