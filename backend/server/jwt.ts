import jsonwebtoken from 'jsonwebtoken';
import { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  userId: string;
  role: 'student' | 'tutor' | 'admin';
  email?: string;
  fullName?: string;
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  // jsonwebtoken is a CommonJS package; use its exported sign via any-cast to avoid ESM interop issues
  return (jsonwebtoken as any).sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
  const decoded = (jsonwebtoken as any).verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}
