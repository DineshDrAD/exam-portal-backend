const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllUsersData,
  getUserBasedOnId,
  updatePassword,
  logoutUser,
  getUserData,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getall", getAllUsersData);
router.get("/get/:userId", getUserBasedOnId);
router.put("/update/password/:userId", updatePassword);
router.get("/me", authMiddleware, getUserData);
router.post("/logout", authMiddleware, logoutUser);

module.exports = router;
