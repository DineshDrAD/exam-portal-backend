const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    levels: {
      type: Number,
      enum: [1, 2, 3, 4], 
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
    subtopics: [subtopicSchema], 
  },
  { timestamps: true }
);

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
