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
      const attemptCounterModel = require("../models/attemptCounterModel");
      const { userId } = req.body;
      const { _id: examId } = req.exam;

      // Atomic operation: Check for existing started submission OR create new one
      let submission = await examSubmissionSchema.findOne({
        userId,
        examId,
        status: "started",
      });

      if (submission) {
        // Idempotent: Return existing started submission
        return res.status(200).json({
          success: true,
          message: "Exam session already active.",
          exam: req.exam,
          submissionId: submission._id,
          startTime: submission.createdAt,
          attemptNumber: submission.attemptNumber,
        });
      }

      // No active submission - create new one with atomic attempt counter
      // Use findOneAndUpdate with $inc for atomic counter increment
      const counter = await attemptCounterModel.findOneAndUpdate(
        { userId, examId },
        { $inc: { currentAttempt: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Create new submission with atomic attempt number
      submission = await examSubmissionSchema.create({
        userId,
        examId,
        attemptNumber: counter.currentAttempt,
        status: "started",
        examData: [], // Empty initially
      });

      res.status(200).json({
        success: true,
        message: "Exam started successfully.",
        exam: req.exam,
        submissionId: submission._id,
        startTime: submission.createdAt,
        attemptNumber: submission.attemptNumber,
      });
    } catch (error) {
      // Handle duplicate key errors (unique constraint violations)
      if (error.code === 11000) {
        // Race condition detected - fetch the existing submission
        const existingSubmission = await examSubmissionSchema.findOne({
          userId: req.body.userId,
          examId: req.exam._id,
          status: "started",
        });

        if (existingSubmission) {
          return res.status(200).json({
            success: true,
            message: "Exam session already active.",
            exam: req.exam,
            submissionId: existingSubmission._id,
            startTime: existingSubmission.createdAt,
            attemptNumber: existingSubmission.attemptNumber,
          });
        }
      }

      res.status(500).json({
        success: false,
        message: "Error starting exam",
        error: error.message,
      });
    }
  }
);

module.exports = router;
