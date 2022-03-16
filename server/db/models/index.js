const Conversation = require("./conversation");
const Recipient = require("./recipient");
const User = require("./user");
const Message = require("./message");

// associations
Conversation.belongsToMany(User, { through: Recipient });
User.belongsToMany(Conversation, { through: Recipient });
Message.belongsTo(Conversation);
Conversation.hasMany(Message);


module.exports = {
  User,
  Conversation,
  Message
};
