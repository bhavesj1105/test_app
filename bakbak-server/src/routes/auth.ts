import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities';
import { otpService } from '../services/otpService';

interface SendOtpBody {
  countryCode: string; // e.g. "+1"
  phone: string; // digits only
}

interface VerifyOtpBody {
  otpId: string;
  code: string; // 6 digits
  countryCode: string;
  phone: string;
}

const router = Router();

// POST /auth/send-otp
router.post('/send-otp', async (req: Request<{}, {}, SendOtpBody>, res: Response): Promise<void> => {
  try {
  const { countryCode, phone } = req.body;

    if (!countryCode || !phone) {
      res.status(400).json({ 
        error: 'Country code and phone number are required' 
      });
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({ 
        error: 'Invalid phone number format' 
      });
      return;
    }

  const result = await otpService.sendOtp({ countryCode, phone });
  res.json({ success: true, message: 'OTP sent', otpId: result.otpId, devCode: result.devCode });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req: Request<{}, {}, VerifyOtpBody>, res: Response): Promise<void> => {
  try {
  const { countryCode, phone, code, otpId } = req.body;

    if (!countryCode || !phone || !code) {
      res.status(400).json({ 
        error: 'Country code, phone number, and OTP code are required' 
      });
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ error: 'Invalid OTP code format' });
      return;
    }
    const verify = await otpService.verifyOtp({ otpId, code, countryCode, phone });
    if (!verify.success) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    
    // Find or create user
    let user = await userRepository.findOne({
      where: { countryCode, phone },
    });

    if (!user) {
      user = userRepository.create({
        countryCode,
        phone,
        isVerified: true,
      });
      await userRepository.save(user);
    } else {
      user.isVerified = true;
      await userRepository.save(user);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }

    const token = (jwt.sign as any)(
      { userId: user.id },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        countryCode: user.countryCode,
        phone: user.phone,
        name: user.name,
        avatarUrl: user.profilePicture || null,
        isProfileComplete: Boolean(user.name),
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /auth/refresh-token
router.post('/refresh-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    // TODO: Implement refresh token logic
    res.status(501).json({ error: 'Refresh token endpoint not implemented' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;
