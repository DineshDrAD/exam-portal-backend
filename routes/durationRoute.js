const express = require("express");
const {
  getDurationData,
  updateDurationData,
} = require("../controllers/durationController");
const router = express.Router();

router.get("/get", getDurationData);
router.put("/update", updateDurationData);

module.exports = router;
