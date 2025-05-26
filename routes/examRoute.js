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
const router = express.Router();

router.get("/getAll", getAllExams);
router.get("/getAllWithoutCorrectAnswers", getAllExamWithoutCorrectAnswers);
router.get("/:id", getExamById);
router.get("/attend/:examCode", getAllExamDetailsWithoutAnswer);
router.post("/create", createExam);
router.put("/update/:id", updateExam);
router.put("/update/shuffle/:id", updateShuffleQuestion);
router.delete("/delete/:id", deleteExam);

module.exports = router;
