import jwt from 'jsonwebtoken';

export class JWTService {
  private static readonly secret = process.env.AUTH_SECRET || 'your-secret-key';
  private static readonly expiresIn = '24h';

  static generateToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export class AuthUtils {
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }
}
