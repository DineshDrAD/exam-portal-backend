const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    levels: {
      type: Number,
      enum: [1, 2, 3, 4], // Only levels 1, 2, 3, and 4
      required: true,
    },
  },
  { timestamps: true }
);

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, 
    },
    subtopics: [subtopicSchema], // Array of subtopics
  },
  { timestamps: true }
);

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
