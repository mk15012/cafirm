import rateLimit from 'express-rate-limit';

// Rate limiting for auth endpoints (login, signup) - generous for development
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 login attempts per minute (generous for dev/testing)
  message: { error: 'Too many login attempts, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter - 5000 RPM (very generous)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5000, // 5000 requests per minute
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sensitive operations rate limiter (password change, etc.)
export const sensitiveOpsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 sensitive operations per hour
  message: { error: 'Too many attempts, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});


