require("dotenv").config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  APP_SECRET: process.env.APP_SECRET,
  blackList: []
};
