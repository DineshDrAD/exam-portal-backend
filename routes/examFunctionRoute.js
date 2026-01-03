const express = require("express");
const checkExamEligibility = require("../middlewares/checkExamEligibility.js");
const {
  getEligibleExamForUser,
  manuallyPassExam,
  deletePassedExam,
} = require("../controllers/examFunctionController.js");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.get(
  "/eligible-exam/:userId",
  verifyToken,
  authorizeRoles("admin", "student"),
  getEligibleExamForUser
);
router.post(
  "/manually-pass-exam",
  verifyToken,
  authorizeRoles("admin"),
  manuallyPassExam
);
router.post(
  "/delete-passed-exam",
  verifyToken,
  authorizeRoles("admin"),
  deletePassedExam
);
router.post(
  "/attend-exam",
  verifyToken,
  authorizeRoles("admin", "student"),
  checkExamEligibility,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "You are eligible to attend this exam.",
      exam: req.exam,
    });
  }
);

module.exports = router;
