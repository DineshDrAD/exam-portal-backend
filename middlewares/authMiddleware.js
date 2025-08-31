// const jwt = require('jsonwebtoken');
// const userModel = require("../models/userModel");

// const authMiddleware = async (req, res, next) => {
//   const token = req.cookies.token;
//   if (!token) return res.status(401).json({ error: "Not logged in" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await userModel.findById(decoded.userId);
//     if (!user || user.sessionToken !== token) {
//       return res
//         .status(401)
//         .json({ error: "Session expired. Please login again" });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Invalid token" });
//   }
// };

// module.exports = authMiddleware;


const jwt = require('jsonwebtoken');
const userModel = require("../models/userModel");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access token required" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;