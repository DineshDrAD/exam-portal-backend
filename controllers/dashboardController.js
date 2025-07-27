const mongoose = require("mongoose");
const ExamSubmission = require("../models/examSubmissionSchema");
const UserPass = require("../models/userPassSchema");
const User = require("../models/userModel");
const Subject = require("../models/subjectModel");
const Question = require("../models/questionModel");
const Exam = require("../models/examModel");

// Dashboard statistics controller
const getDashboardStats = async (req, res) => {
  try {
    // Get total students enrolled
    const totalStudents = await User.countDocuments({ role: "student" });

    // Get total exam submissions (students who appeared for exam)
    const studentsAppeared = await ExamSubmission.distinct("userId");
    const studentsAppearedCount = studentsAppeared.length;

    // Get all subjects with subtopics
    const subjects = await Subject.find({}).populate("subtopics");

    // Get student completion statistics (Subject wise-subtopic wise-level wise)
    const completionStats = await UserPass.aggregate([
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      {
        $unwind: "$subjectInfo",
      },
      {
        $group: {
          _id: {
            subject: "$subject",
            subjectName: "$subjectInfo.name",
            subTopic: "$subTopic",
            level: "$level",
          },
          totalStudents: { $sum: 1 },
          passedStudents: {
            $sum: {
              $cond: [{ $eq: ["$pass", true] }, 1, 0],
            },
          },
        },
      },
      {
        $group: {
          _id: {
            subject: "$_id.subject",
            subjectName: "$_id.subjectName",
          },
          levels: {
            $push: {
              subTopic: "$_id.subTopic",
              level: "$_id.level",
              totalStudents: "$totalStudents",
              passedStudents: "$passedStudents",
              passPercentage: {
                $multiply: [
                  { $divide: ["$passedStudents", "$totalStudents"] },
                  100,
                ],
              },
            },
          },
        },
      },
    ]);

    // Get student marks distribution
    const marksDistribution = await ExamSubmission.aggregate([
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "examInfo",
        },
      },
      {
        $unwind: "$examInfo",
      },
      {
        $lookup: {
          from: "subjects",
          localField: "examInfo.subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      {
        $unwind: "$subjectInfo",
      },
      {
        $group: {
          _id: {
            subject: "$subjectInfo.name",
            level: "$examInfo.level",
          },
          avgMarks: { $avg: "$obtainedMark" },
          maxMarks: { $max: "$obtainedMark" },
          minMarks: { $min: "$obtainedMark" },
          totalSubmissions: { $sum: 1 },
        },
      },
    ]);

    // Get question statistics (Subject wise-subtopic wise-level wise)
    const questionStats = await Question.aggregate([
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      {
        $unwind: "$subjectInfo",
      },
      {
        $group: {
          _id: {
            subject: "$subjectInfo.name",
            subjectId: "$subject",
            subTopic: "$subTopic",
            level: "$level",
          },
          totalQuestions: { $sum: 1 },
          questionTypes: {
            $push: "$questionType",
          },
        },
      },
      {
        $sort: { "_id.subject": 1, "_id.level": 1 },
      },
    ]);

    // Get student rankings
    const studentRankings = await ExamSubmission.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "examInfo",
        },
      },
      {
        $unwind: "$examInfo",
      },
      {
        $group: {
          _id: "$userId",
          username: { $first: "$userInfo.username" },
          email: { $first: "$userInfo.email" },
          totalMarks: { $sum: "$obtainedMark" },
          totalExams: { $sum: 1 },
          averageMarks: { $avg: "$obtainedMark" },
          passedExams: {
            $sum: {
              $cond: [{ $eq: ["$pass", true] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { totalMarks: -1 },
      },
      {
        $limit: 100,
      },
    ]);

    // Get exam appearance statistics (number of students appeared for each exam)
    const examAppearanceStats = await ExamSubmission.aggregate([
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "examInfo",
        },
      },
      {
        $unwind: "$examInfo",
      },
      {
        $lookup: {
          from: "subjects",
          localField: "examInfo.subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      {
        $unwind: "$subjectInfo",
      },
      {
        $group: {
          _id: {
            examId: "$examId",
            examTitle: "$examInfo.title",
            subject: "$subjectInfo.name",
            level: "$examInfo.level",
            subTopic: "$examInfo.subTopic",
          },
          studentsAppeared: { $sum: 1 },
          averageMarks: { $avg: "$obtainedMark" },
          passedStudents: {
            $sum: {
              $cond: [{ $eq: ["$pass", true] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { "_id.subject": 1, "_id.level": 1 },
      },
    ]);

    // Get recent activity
    const recentActivity = await ExamSubmission.find({})
      .populate("userId", "username email")
      .populate({
        path: "examId",
        populate: {
          path: "subject",
          model: "Subject",
        },
      })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          studentsAppeared: studentsAppearedCount,
          totalSubjects: subjects.length,
          totalExams: await Exam.countDocuments(),
        },
        completionStats,
        marksDistribution,
        questionStats,
        studentRankings,
        examAppearanceStats,
        recentActivity,
        subjects,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// Get subject-wise detailed statistics with subtopics and levels
const getSubjectWiseStats = async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Get subject details
    const subject = await Subject.findById(subjectId).populate("subtopics");
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Get subject completion statistics
    const subjectStats = await ExamSubmission.aggregate([
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "examInfo",
        },
      },
      {
        $unwind: "$examInfo",
      },
      {
        $match: {
          "examInfo.subject": new mongoose.Types.ObjectId(subjectId),
        },
      },
      {
        $group: {
          _id: {
            level: "$examInfo.level",
            subTopic: "$examInfo.subTopic",
          },
          totalSubmissions: { $sum: 1 },
          avgMarks: { $avg: "$obtainedMark" },
          passedStudents: {
            $sum: {
              $cond: [{ $eq: ["$pass", true] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { "_id.level": 1 },
      },
    ]);

    // Get question statistics for this subject
    const questionStats = await Question.aggregate([
      {
        $match: {
          subject: new mongoose.Types.ObjectId(subjectId),
        },
      },
      {
        $group: {
          _id: {
            level: "$level",
            subTopic: "$subTopic",
          },
          totalQuestions: { $sum: 1 },
          questionTypes: {
            $push: "$questionType",
          },
        },
      },
      {
        $sort: { "_id.level": 1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        subject,
        subjectStats,
        questionStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subject statistics",
      error: error.message,
    });
  }
};

// Get level-wise performance
const getLevelWisePerformance = async (req, res) => {
  try {
    const levelPerformance = await ExamSubmission.aggregate([
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "examInfo",
        },
      },
      {
        $unwind: "$examInfo",
      },
      {
        $group: {
          _id: "$examInfo.level",
          totalSubmissions: { $sum: 1 },
          avgMarks: { $avg: "$obtainedMark" },
          passRate: {
            $avg: {
              $cond: [{ $eq: ["$pass", true] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      success: true,
      data: levelPerformance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch level performance",
      error: error.message,
    });
  }
};

// Get subtopic-wise statistics for a subject
const getSubtopicWiseStats = async (req, res) => {
  try {
    const { subjectId, subtopicId } = req.params;

    const subtopicStats = await ExamSubmission.aggregate([
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "examInfo",
        },
      },
      {
        $unwind: "$examInfo",
      },
      {
        $match: {
          "examInfo.subject": new mongoose.Types.ObjectId(subjectId),
          "examInfo.subTopic": new mongoose.Types.ObjectId(subtopicId),
        },
      },
      {
        $group: {
          _id: {
            level: "$examInfo.level",
          },
          totalSubmissions: { $sum: 1 },
          avgMarks: { $avg: "$obtainedMark" },
          passedStudents: {
            $sum: {
              $cond: [{ $eq: ["$pass", true] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { "_id.level": 1 },
      },
    ]);

    res.json({
      success: true,
      data: subtopicStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subtopic statistics",
      error: error.message,
    });
  }
};

// Get detailed student completion status
const getStudentCompletionStatus = async (req, res) => {
  try {
    const { subjectId, subtopicId, level } = req.query;

    let matchCondition = {};
    if (subjectId)
      matchCondition.subject = new mongoose.Types.ObjectId(subjectId);
    if (subtopicId)
      matchCondition.subTopic = new mongoose.Types.ObjectId(subtopicId);
    if (level) matchCondition.level = parseInt(level);

    const completionStatus = await UserPass.aggregate([
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      {
        $unwind: "$subjectInfo",
      },
      {
        $project: {
          userId: "$userId",
          username: "$userInfo.username",
          email: "$userInfo.email",
          subject: "$subjectInfo.name",
          subTopic: "$subTopic",
          level: "$level",
          pass: "$pass",
          marks: "$marks",
          createdAt: "$createdAt",
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.json({
      success: true,
      data: completionStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch student completion status",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getSubjectWiseStats,
  getLevelWisePerformance,
  getSubtopicWiseStats,
  getStudentCompletionStatus,
};
