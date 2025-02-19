const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllUsersData,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getall", getAllUsersData);

module.exports = router;
