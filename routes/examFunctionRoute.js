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
  async (req, res) => {
    try {
      const examSubmissionSchema = require("../models/examSubmissionSchema");
      const { userId } = req.body;
      const { _id: examId } = req.exam;

      // Check for existing started submission
      let submission = await examSubmissionSchema.findOne({
        userId,
        examId,
        status: "started",
      });

      if (!submission) {
        const previousAttempts = await examSubmissionSchema.countDocuments({
          userId,
          examId,
          status: "completed",
        });

        submission = await examSubmissionSchema.create({
          userId,
          examId,
          attemptNumber: previousAttempts + 1,
          status: "started",
          examData: [], // Empty initially
        });
      }

      res.status(200).json({
        success: true,
        message: "Exam started successfully.",
        exam: req.exam,
        submissionId: submission._id,
        startTime: submission.createdAt,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error starting exam",
        error: error.message,
      });
    }
  }
);

module.exports = router;
