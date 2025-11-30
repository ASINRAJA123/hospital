const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    // Determine the status code, defaulting to 500 if not already set
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Mongoose bad ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(404).json({
            message: 'Resource not found',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue);
        const message = `Duplicate field value entered: ${field}. Please use another value.`;
        return res.status(400).json({
            message: message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            message: messages.join(', '),
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    // Default error response
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};


module.exports = { notFound, errorHandler };