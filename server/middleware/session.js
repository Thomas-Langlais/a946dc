const { User } = require("../db/models");

const userSession = (req, _, next) => {
  const { session } = req;
  if (session) {
    const { userId } = session;
    
    if (userId) {
      User.findOne({
        where: { id: userId },
        attributes: ['id', 'username', 'email', 'photoUrl'],
      }).then((user) => {
        req.user = user;
        return next();
      });
    } else {
      next()
    }
  } else {
    return next();
  }
};

module.exports = {
  userSession
};