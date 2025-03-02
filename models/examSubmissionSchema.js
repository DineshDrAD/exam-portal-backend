const mongoose = require("mongoose");

const ExamSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Improves query performance
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    examData: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        answer: {
          type: mongoose.Schema.Types.Mixed, // Supports multiple answer types
          required: true,
        },
      },
    ],
    pass: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

ExamSubmissionSchema.index({ userId: 1, examId: 1 });

module.exports = mongoose.model("ExamSubmission", ExamSubmissionSchema);
