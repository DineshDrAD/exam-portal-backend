const express = require("express");
const {
  submitExam,
  getPassedSubmissionForUser,
  getPreviousAttemptForUser,
  getExamSubmissionById,
} = require("../controllers/examSubmissionController");
const router = express.Router();

router.get("/completed/:userId", getPassedSubmissionForUser);
router.get("/previous-attempt/:userId", getPreviousAttemptForUser);
router.get("/get/:examSubmissionId", getExamSubmissionById);
router.post("/submit", submitExam);

module.exports = router;
