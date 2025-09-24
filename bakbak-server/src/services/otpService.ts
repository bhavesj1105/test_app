// Swappable OTP service wrapper. Replace implementation with real Twilio Verify.
import crypto from 'crypto';

export interface SendOtpRequest {
  phone: string; // E.164 without country code or with? We'll pass fullNumber for simplicity
  countryCode: string; // e.g. +1
}

export interface SendOtpResponse {
  success: boolean;
  otpId: string; // reference id for verification flow
}

export interface VerifyOtpRequest {
  otpId: string;
  code: string;
  phone: string;
  countryCode: string;
}

export interface VerifyOtpResponse {
  success: boolean;
}

// In-memory store for dev
const store = new Map<string, { code: string; phone: string; fullNumber: string; expiresAt: number }>();

const devMode = process.env.NODE_ENV !== 'production';

export const otpService = {
  async sendOtp(req: SendOtpRequest): Promise<SendOtpResponse & { devCode?: string }> {
    const fullNumber = `${req.countryCode}${req.phone}`;
    // Generate 6-digit OTP and id
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const otpId = crypto.randomBytes(8).toString('hex');
    const ttlMs = 5 * 60 * 1000;

    store.set(otpId, { code, phone: req.phone, fullNumber, expiresAt: Date.now() + ttlMs });

    // Here you would call Twilio Verify API instead of storing locally
    // await twilio.verify.services(VERIFY_SID).verifications.create({ to: fullNumber, channel: 'sms' });

    return { success: true, otpId, ...(devMode ? { devCode: code } : {}) };
  },

  async verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    // In Twilio, you'd check verification via verificationChecks.create({ to, code })
    const rec = store.get(req.otpId);
    if (!rec) return { success: false };
    if (rec.expiresAt < Date.now()) {
      store.delete(req.otpId);
      return { success: false };
    }
    if (rec.code !== req.code) return { success: false };

    // OTP ok; cleanup
    store.delete(req.otpId);
    return { success: true };
  },
};
