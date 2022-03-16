const Sequelize = require("sequelize");
const db = require("../db");

const Recipient = db.define("recipient", {
  readMessage: {
    type: Sequelize.INTEGER,
    allowNulls: false,
  },
});

module.exports = Recipient;
