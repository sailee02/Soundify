const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const generateJWT = (req, res) => {
  let jwtSecretKey = process.env.JWT_SECRET_KEY;
  let data = {
    time: Date(),
  };

  const token = jwt.sign(data, jwtSecretKey);

  res.send(token);
};

module.exports = generateJWT;
