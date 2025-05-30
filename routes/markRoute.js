const express = require("express");
const {
  getMarkData,
  updateMarkData,
} = require("../controllers/markController");
const router = express.Router();

router.get("/get", getMarkData);
router.put("/update", updateMarkData);

module.exports = router;
