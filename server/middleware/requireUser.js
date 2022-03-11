const createError = require("http-errors")

function requireUser(req, res, next) {
    if (!req.user) {
        return next(
            createError(401, "User must be logged in")
        );
    }
    next();
}

module.exports = requireUser;