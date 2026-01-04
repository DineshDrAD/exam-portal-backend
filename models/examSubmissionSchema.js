const mongoose = require("mongoose");

const ExamSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
        studentAnswer: {
          type: mongoose.Schema.Types.Mixed, // Supports multiple answer types
          // required: true,
        },
        correctAnswer: {
          type: mongoose.Schema.Types.Mixed, // Supports multiple answer types
        },
        isRight: {
          type: String,
          enum: ["Correct", "Incorrect", "Partially Correct", "Skipped"],
          default: "Skipped",
        },
      },
    ],
    timetaken: {
      type: Number,
      default: 0, // Time taken in seconds
    },
    obtainedMark: {
      type: Number,
      default: 0,
    },
    pass: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["started", "completed"],
      default: "completed", // Default to completed for backward compatibility
    },
    reviews: [
      {
        evaluator: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

ExamSubmissionSchema.path("reviews").schema.set("timestamps", true);

ExamSubmissionSchema.index({ userId: 1, examId: 1 });

module.exports = mongoose.model("ExamSubmission", ExamSubmissionSchema);
