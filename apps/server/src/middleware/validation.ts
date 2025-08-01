import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

// Base validation schemas
export const emailSchema = z.string()
  .email('Geçerli bir e-posta adresi girin')
  .min(5, 'E-posta en az 5 karakter olmalı')
  .max(254, 'E-posta en fazla 254 karakter olabilir')
  .toLowerCase()
  .trim();

export const passwordSchema = z.string()
  .min(8, 'Şifre en az 8 karakter olmalı')
  .max(128, 'Şifre en fazla 128 karakter olabilir')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermeli');

export const nameSchema = z.string()
  .min(2, 'İsim en az 2 karakter olmalı')
  .max(50, 'İsim en fazla 50 karakter olabilir')
  .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'İsim sadece harf ve boşluk içerebilir')
  .trim();

// Auth validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Şifre gerekli')
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword']
});

export const passwordResetSchema = z.object({
  email: emailSchema
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Yeni şifreler eşleşmiyor',
  path: ['confirmNewPassword']
});

// Generic validation middleware factory
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          error: 'Girilen bilgilerde hata var',
          code: 'VALIDATION_ERROR',
          details: errors
        });
      }

      // Replace req.body with validated data
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({
        error: 'Doğrulama sırasında hata oluştu',
        code: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
};

// Specific validation middlewares
export const validateLogin = validateSchema(loginSchema);
export const validateRegister = validateSchema(registerSchema);
export const validatePasswordReset = validateSchema(passwordResetSchema);
export const validatePasswordChange = validateSchema(passwordChangeSchema);

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize all string values in req.body
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/[<>]/g, '') // Basic XSS prevention
        .slice(0, 1000); // Prevent extremely long inputs
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  next();
};
