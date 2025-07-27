const express = require("express");
const {
  getDashboardStats,
  getSubjectWiseStats,
  getLevelWisePerformance,
  getSubtopicWiseStats,
  getStudentCompletionStatus,
} = require("../controllers/dashboardController");

const router = express.Router();

// Main dashboard statistics
router.get("/stats", getDashboardStats);

// Subject-wise statistics
router.get("/subject/:subjectId", getSubjectWiseStats);

// Level-wise performance
router.get("/level-performance", getLevelWisePerformance);

// Subtopic-wise statistics for a subject
router.get("/subject/:subjectId/subtopic/:subtopicId", getSubtopicWiseStats);

// Student completion status with filtering
router.get("/student-completion", getStudentCompletionStatus);

module.exports = router;
