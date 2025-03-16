const express = require("express");
const {
  submitExam,
  getPassedSubmissionForUser,
  getPreviousAttemptForUser,
  getExamSubmissionById,
  getAllPassedSubmission,
  getAllPreviousAttempt,
  submitReviewForExamSubmission,
  deleteCommentInExamSubmission,
  updateCommentInExamSubmission,
} = require("../controllers/examSubmissionController");
const router = express.Router();

router.get("/completed/get", getAllPassedSubmission);
router.get("/completed/:userId", getPassedSubmissionForUser);
router.get("/previous-attempt/get", getAllPreviousAttempt);
router.get("/previous-attempt/:userId", getPreviousAttemptForUser);
router.get("/get/:examSubmissionId", getExamSubmissionById);
router.post("/submit", submitExam);
router.put("/add-comment", submitReviewForExamSubmission);
router.put("/comment/update/:examId/:reviewId", updateCommentInExamSubmission);
router.delete(
  "/comment/delete/:examId/:reviewId",
  deleteCommentInExamSubmission
);

module.exports = router;
