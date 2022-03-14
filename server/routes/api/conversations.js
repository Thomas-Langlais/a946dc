const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
      attributes: ["id", "user1ReadMessage", "user2ReadMessage"],
      order: [
        ["updatedAt", "DESC"],
        [Message, "createdAt", "ASC"],
      ],
      include: [
        { model: Message },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
      ],
    });

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];
      const convoJSON = convo.toJSON();

      // set a property "otherUser" so that frontend will have easier access
      if (convoJSON.user1) {
        convoJSON.otherUser = convoJSON.user1;
        convoJSON.otherUser.lastReadMessage = convoJSON.user1ReadMessage;
        delete convoJSON.user1;
        delete convoJSON.user1ReadMessage;
      } else if (convoJSON.user2) {
        convoJSON.otherUser = convoJSON.user2;
        convoJSON.otherUser.lastReadMessage = convoJSON.user2ReadMessage;
        delete convoJSON.user2;
        delete convoJSON.user2ReadMessage;
      }

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }

      // set properties for notification count and latest message preview
      const last = convoJSON.messages.length - 1;
      convoJSON.latestMessageText = convoJSON.messages[last].text;

      // set the properties for user read status
      const userReadMessage =
        convoJSON.user1 === null
          ? convoJSON.user1ReadMessage
          : convoJSON.user2ReadMessage;

      const unreadMessages = convoJSON.messages.reduce((count, msg) => {
        if (msg.senderId === userId) return count;

        if (msg.id > userReadMessage) return count + 1;
        return count;
      }, 0);
      convoJSON.unreadMessages = unreadMessages;

      // set the read status of the other user on the last read message
      const otherUserReadMessage = convoJSON.otherUser.lastReadMessage;
      const messages = convoJSON.messages;

      let prev = -1,
        current = 0;
      const otherUser = convoJSON.otherUser;

      while (
        current < messages.length &&
        otherUserReadMessage >= messages[current].id
      ) {
        if (messages[current].senderId === userId) prev = current;
        current++;
      }
      if (prev >= 0) messages[prev].userLastRead = otherUser;

      conversations[i] = convoJSON;
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
