const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  subTopic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subtopic",
    required: true,
  },
  level: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4],
  },
  questionType: {
    type: String,
    enum: ["MCQ", "Fill in the Blanks", "MSQ", "Short Answer"],
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String], // Array of options (for MCQ & MSQ)
    default: undefined, // Only needed for MCQ & MSQ
  },
  correctAnswers: {
    type: [String], // Can store correct answers for MCQ, MSQ, Fill in the Blanks
    required: true,
  },
});

module.exports = mongoose.model("Question", QuestionSchema);
