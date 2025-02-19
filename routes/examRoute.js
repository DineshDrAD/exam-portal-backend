const express = require("express");
const {
  getAllExams,
  getAllExamWithoutCorrectAnswers,
  createExam,
  updateExam,
  deleteExam,
  getExamById,
} = require("../controllers/examController");
const router = express.Router();

router.get("/getAll", getAllExams);
router.get("/getAllWithoutCorrectAnswers", getAllExamWithoutCorrectAnswers);
router.get("/:id", getExamById);
router.post("/create", createExam);
router.put("/update/:id", updateExam);
router.delete("/delete/:id", deleteExam);

module.exports = router;
