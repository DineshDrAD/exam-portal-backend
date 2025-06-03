const express = require("express");
const checkExamEligibility = require("../middlewares/checkExamEligibility.js");
const {
  getEligibleExamForUser,
  manuallyPassExam,
  deletePassedExam,
} = require("../controllers/examFunctionController.js");

const router = express.Router();

router.get("/eligible-exam/:userId", getEligibleExamForUser);
router.post("/manually-pass-exam", manuallyPassExam);
router.post("/delete-passed-exam", deletePassedExam);
router.post("/attend-exam", checkExamEligibility, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You are eligible to attend this exam.",
    exam: req.exam,
  });
});

module.exports = router;
