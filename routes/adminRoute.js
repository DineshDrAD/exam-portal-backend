const express = require("express");
const {
  triggerMail,
  deleteUserEntirely,
} = require("../controllers/adminController");
const router = express.Router();

router.post("/trigger-mail", triggerMail);
router.delete("/delete-user/:userId", deleteUserEntirely);

module.exports = router;
