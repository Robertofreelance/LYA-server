const jwt = require("jsonwebtoken");
const { APP_SECRET, blackList } = require("./config");

module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null ) return res.sendStatus(401);
  if(blackList.includes(token)) return res.status(500).json({
    message: "Token invalido",
    success: false,
  });
  jwt.verify(token, APP_SECRET, (err, user) => {
    console.log(err);

    if (err) return res.sendStatus(403);

    req.user = user;

    next();
  });
};
