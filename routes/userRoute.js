const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllUsersData,
  getUserBasedOnId,
  updatePassword,
  logoutUser,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getall", getAllUsersData);
router.get("/get/:userId", getUserBasedOnId);
router.put("/update/password/:userId", updatePassword);
router.post("/logout", logoutUser);

module.exports = router;
