// Input validation middleware using express-validator
const {
  body, query, param, validationResult,
} = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Auth validation
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
    .withMessage('Password must contain letters, numbers, and special characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  handleValidationErrors,
];

const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Weather validation
const validateWeatherQuery = [
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lon')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('cityId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('City ID must be a positive integer'),
  handleValidationErrors,
];

// Forecast validation
const validateForecastCreate = [
  body('city_id')
    .isInt({ min: 1 })
    .withMessage('City ID must be a positive integer'),
  body('timestamp')
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO8601 date'),
  body('predicted_temperature')
    .isFloat()
    .withMessage('Temperature must be a number'),
  body('predicted_humidity')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Humidity must be between 0 and 100'),
  body('predicted_rainfall')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rainfall must be non-negative'),
  handleValidationErrors,
];

// City validation
const validateCityCreate = [
  body('name_th')
    .trim()
    .notEmpty()
    .withMessage('Thai name is required'),
  body('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('lon')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('province_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Province ID must be a positive integer'),
  handleValidationErrors,
];

// ID validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID format'),
  handleValidationErrors,
];

// Pagination validation
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateWeatherQuery,
  validateForecastCreate,
  validateCityCreate,
  validateId,
  validatePagination,
  handleValidationErrors,
};
