const { body, query, validationResult } = require('express-validator');

const validatePredictByCity = [
  body('cityId')
    .exists().withMessage('cityId is required')
    .isInt({ min: 1 }).withMessage('cityId must be an integer >= 1'),
  handleValidationResult
];

const validatePredictByLocation = [
  body('lat')
    .exists().withMessage('lat is required')
    .isFloat().withMessage('lat must be a number'),
  body('lon')
    .exists().withMessage('lon is required')
    .isFloat().withMessage('lon must be a number'),
  handleValidationResult
];

const validateGet7DayTimeline = [
  query('lat').exists().withMessage('lat is required').isFloat().withMessage('lat must be a number'),
  query('lon').exists().withMessage('lon is required').isFloat().withMessage('lon must be a number'),
  handleValidationResult
];

function handleValidationResult(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = {
  validatePredictByCity,
  validatePredictByLocation,
  validateGet7DayTimeline,
  handleValidationResult
};
