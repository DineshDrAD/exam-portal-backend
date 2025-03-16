const userPassSchema = require("../models/userPassSchema");
const examModel = require("../models/examModel");

const checkExamEligibility = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const { examCode } = req.body; // Assuming examCode is sent in the request body

    // Find the exam details
    const exam = await examModel
      .findOne({ examCode })
      .populate({
        path: "questions",
        select: "-correctAnswers", // Exclude correctAnswers field
      })
      .lean();
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if the user has completed the previous level
    const userProgress = await userPassSchema.findOne({
      userId,
      subject: exam.subject,
      subTopic: exam.subTopic,
      level: exam.level - 1, // User must have passed the previous level
      pass: true,
    });

    if (exam.level === 1 || userProgress) {
      // User is eligible
      req.exam = exam; // Pass exam details to the next middleware
      return next();
    } else {
      // User is not eligible
      return res.status(403).json({
        success: false,
        message: "You are not eligible to attend this exam.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking exam eligibility",
      error: error.message,
    });
  }
};

module.exports = checkExamEligibility;
