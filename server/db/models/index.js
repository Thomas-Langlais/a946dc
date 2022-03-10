const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");

// associations

User.hasMany(Conversation);
Conversation.belongsTo(User, { as: "user1" });
Conversation.belongsTo(User, { as: "user2" });
Message.belongsTo(Conversation);
Conversation.hasMany(Message);

// Hooks
const conversationUpdatedAtUpdate = async (msg, { transaction }) => {
  const updatedAt = msg.createdAt;

  const convo = await Conversation.findByPk(msg.conversationId, { transaction });

  convo.changed('updatedAt', true);
  
  await convo.update({
    updatedAt
  });
};

Message.afterCreate(conversationUpdatedAtUpdate);

module.exports = {
  User,
  Conversation,
  Message
};
