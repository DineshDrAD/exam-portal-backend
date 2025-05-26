const mongoose = require("mongoose");

const userPassSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Improves query performance
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    subTopic: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    level: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },
    pass: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userPassSchema.index({ userId: 1, subject: 1, subTopic: 1, level: 1 });

module.exports = mongoose.model("UserPass", userPassSchema);
