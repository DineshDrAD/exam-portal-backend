const express = require("express");
const {
  addComment,
  deleteComment,
  getCommentByEvaluator,
  editComment,
  getAllComment,
  getCommentByRangeForStudents,
} = require("../controllers/reviewController");
const router = express.Router();

router.get("/get", getAllComment);
router.get("/get-by-evaluator/:evaluatorId", getCommentByEvaluator);
router.get("/get-by-range", getCommentByRangeForStudents);
router.post("/create", addComment);
router.put("/edit/:commentId", editComment);
router.delete("/delete/:commentId", deleteComment);

module.exports = router;
