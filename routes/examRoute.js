const express = require("express");
const {
  getAllExams,
  getAllExamWithoutCorrectAnswers,
  createExam,
  updateExam,
  deleteExam,
  getExamById,
  getAllExamDetailsWithoutAnswer,
  updateShuffleQuestion,
} = require("../controllers/examController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/getAll", verifyToken, authorizeRoles("admin"), getAllExams);
router.get("/getAllWithoutCorrectAnswers", getAllExamWithoutCorrectAnswers);
router.get("/:id", verifyToken, authorizeRoles("admin"), getExamById);
router.get("/attend/:examCode", getAllExamDetailsWithoutAnswer);
router.post("/create", verifyToken, authorizeRoles("admin"), createExam);
router.put("/update/:id", verifyToken, authorizeRoles("admin"), updateExam);
router.put(
  "/update/shuffle/:id",
  verifyToken,
  authorizeRoles("admin"),
  updateShuffleQuestion
);
router.delete("/delete/:id", verifyToken, authorizeRoles("admin"), deleteExam);

module.exports = router;
