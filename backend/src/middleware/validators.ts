import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: (err as any).path,
        message: err.msg
      }))
    });
  }
  next();
};

// ==================== AUTH VALIDATORS ====================

export const loginValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

export const signupValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('Password must contain at least one letter and one number'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s-]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors,
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('New password must contain at least one letter and one number'),
  handleValidationErrors,
];

// ==================== CLIENT VALIDATORS ====================

export const createClientValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Client name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s-]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('pan')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Please provide a valid PAN number (e.g., ABCDE1234F)'),
  handleValidationErrors,
];

// ==================== TASK VALIDATORS ====================

export const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Priority must be Low, Medium, High, or Urgent'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  handleValidationErrors,
];

// ==================== CREDENTIAL VALIDATORS ====================

export const createCredentialValidator = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid client ID'),
  body('portalName')
    .trim()
    .notEmpty()
    .withMessage('Portal name is required')
    .isLength({ max: 100 })
    .withMessage('Portal name must not exceed 100 characters'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ max: 200 })
    .withMessage('Username must not exceed 200 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('portalUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL'),
  handleValidationErrors,
];

// ==================== COMMON VALIDATORS ====================

export const idParamValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID parameter'),
  handleValidationErrors,
];

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

