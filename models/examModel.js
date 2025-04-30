const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    subTopic: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    level: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
    },
    examCode: {
      type: String,
      unique: true,
      required: true,
    },
    passPercentage: {
      type: Number,
      default: 90,
    },
    shuffleQuestion: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Exam", examSchema);
