const express = require("express");
const { triggerMail } = require("../controllers/adminController");
const router = express.Router();

router.post("/trigger-mail", triggerMail);

module.exports = router;
