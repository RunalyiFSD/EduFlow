const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

const validateRequest = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Assign validated and parsed/coerced values back to the request object
    if (validated.body !== undefined) req.body = validated.body;
    if (validated.query !== undefined) req.query = validated.query;
    if (validated.params !== undefined) req.params = validated.params;
    
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      next(new ApiError(400, `Validation failed: ${errorMessages.join(', ')}`));
    } else {
      next(error);
    }
  }
};

module.exports = validateRequest;
