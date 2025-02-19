const mongoose = require('mongoose');

// Define a Subtopic Schema
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

// Define a Subject Schema
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

// Create a model from the schema
const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
