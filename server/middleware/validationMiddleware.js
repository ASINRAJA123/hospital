// This file is a placeholder to show how it would be done.
// For this project, we will use Mongoose's powerful built-in validation.

const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details.map(d => d.message).join(', '));
    }
    next();
  };
};

module.exports = validateRequest;