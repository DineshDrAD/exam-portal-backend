const mongoose = require("mongoose");
const ExamSubmission = require("../models/examSubmissionSchema");
const UserPass = require("../models/userPassSchema");
const User = require("../models/userModel");
const Subject = require("../models/subjectModel");
const Question = require("../models/questionModel");
const Exam = require("../models/examModel");
const markModel = require("../models/markModel");
const { getPostiveMarkForLevel } = require("./markController");

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

// Get all exams overview
const getAllExamsOverview = async (req, res) => {
  try {
    const exams = await Exam.find({ status: "active" })
      .populate("subject", "name subtopics")
      .lean();

    const examOverviews = await Promise.all(
      exams.map(async (exam) => {
        const submissions = await ExamSubmission.find({ examId: exam._id });

        const totalSubmissions = submissions.length;
        const marks = submissions.map((s) => s.obtainedMark || 0);

        const avgScore =
          totalSubmissions > 0
            ? marks.reduce((a, b) => a + b, 0) / totalSubmissions
            : 0;

        const passedStudents = submissions.filter((s) => s.pass).length;
        const passRate =
          totalSubmissions > 0 ? (passedStudents / totalSubmissions) * 100 : 0;

        const highestMark = totalSubmissions > 0 ? Math.max(...marks) : 0;
        const lowestMark = totalSubmissions > 0 ? Math.min(...marks) : 0;

        // 🔑 Find subtopic inside subject
        const subTopicObj = exam.subject?.subtopics?.find(
          (st) => st._id.toString() === exam.subTopic.toString()
        );

        return {
          _id: exam._id,
          examCode: exam.examCode,
          subject: {
            _id: exam.subject._id,
            name: exam.subject.name,
          },
          subTopic: subTopicObj
            ? { _id: subTopicObj._id, name: subTopicObj.name }
            : null,
          level: exam.level,
          totalSubmissions,
          avgScore: Number(avgScore.toFixed(2)),
          passRate: Number(passRate.toFixed(2)),
          highestMark,
          lowestMark,
        };
      })
    );

    // Calculate overall statistics
    const totalStudents = examOverviews.reduce(
      (sum, exam) => sum + exam.totalSubmissions,
      0
    );
    const overallAvgScore =
      examOverviews.length > 0
        ? examOverviews.reduce((sum, exam) => sum + exam.avgScore, 0) /
          examOverviews.length
        : 0;
    const overallPassRate =
      examOverviews.length > 0
        ? examOverviews.reduce((sum, exam) => sum + exam.passRate, 0) /
          examOverviews.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        exams: examOverviews,
        statistics: {
          totalStudents,
          overallAvgScore: parseFloat(overallAvgScore.toFixed(2)),
          overallPassRate: parseFloat(overallPassRate.toFixed(2)),
          totalExams: examOverviews.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching exams overview:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching exams overview",
      error: error.message,
    });
  }
};

// Get detailed exam analysis
const getExamDetailedAnalysis = async (req, res) => {
  try {
    const { examId } = req.params;

    // 1️⃣ Fetch exam with subject + embedded subtopics
    const exam = await Exam.findById(examId)
      .populate("subject", "name subtopics")
      .populate("questions")
      .lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // 2️⃣ Resolve exam-level subTopic manually
    const examSubTopic =
      exam.subject?.subtopics?.find(
        (st) => st._id.toString() === exam.subTopic?.toString()
      ) || null;

    // 3️⃣ Fetch submissions
    const submissions = await ExamSubmission.find({ examId })
      .populate("userId", "username email")
      .populate(
        "examData.questionId",
        "question subTopic questionType correctAnswer"
      )
      .lean();

    /* =======================
       A. EXAM SUMMARY
    ======================= */
    const totalSubmission = submissions.length;
    const marks = submissions.map((s) => s.obtainedMark || 0);

    const highestMark = totalSubmission > 0 ? Math.max(...marks) : 0;
    const lowestMark = totalSubmission > 0 ? Math.min(...marks) : 0;
    const averageMark =
      totalSubmission > 0
        ? marks.reduce((a, b) => a + b, 0) / totalSubmission
        : 0;

    /* =======================
       B. PERFORMANCE DISTRIBUTION
    ======================= */
    const above75 = submissions.filter(
      (s) => (s.obtainedMark / s.examData.length) * 100 > 75
    ).length;
    const between50_75 = submissions.filter(
      (s) =>
        (s.obtainedMark / s.examData.length) * 100 >= 50 &&
        (s.obtainedMark / s.examData.length) * 100 <= 75
    ).length;
    const below50 = submissions.filter(
      (s) => (s.obtainedMark / s.examData.length) * 100 < 50
    ).length;

    const performanceDistribution = {
      above75: {
        count: above75,
        percentage:
          totalSubmission > 0
            ? Number(((above75 / totalSubmission) * 100).toFixed(1))
            : 0,
      },
      between50_75: {
        count: between50_75,
        percentage:
          totalSubmission > 0
            ? Number(((between50_75 / totalSubmission) * 100).toFixed(1))
            : 0,
      },
      below50: {
        count: below50,
        percentage:
          totalSubmission > 0
            ? Number(((below50 / totalSubmission) * 100).toFixed(1))
            : 0,
      },
    };

    /* =======================
       C. TOP PERFORMERS
    ======================= */
    const topPerformers = [...submissions]
      .sort((a, b) => b.obtainedMark - a.obtainedMark)
      .slice(0, 5)
      .map((sub, index) => ({
        rank: index + 1,
        name: sub.userId?.username || "Unknown",
        email: sub.userId?.email || "N/A",
        marks: sub.obtainedMark,
      }));

    /* =======================
       D. SUBTOPIC-WISE ANALYSIS
    ======================= */
    const subTopicAnalysis = {};

    submissions.forEach((sub) => {
      sub.examData.forEach((q) => {
        if (!q.questionId || !q.questionId.subTopic) return;

        const subTopicId = q.questionId.subTopic.toString();

        // 🔑 Resolve subtopic from subject
        const subTopicObj = exam.subject.subtopics.find(
          (st) => st._id.toString() === subTopicId
        );

        const subTopicName = subTopicObj?.name || "Unknown";

        if (!subTopicAnalysis[subTopicId]) {
          subTopicAnalysis[subTopicId] = {
            subTopicId,
            subTopicName,
            correct: 0,
            total: 0,
          };
        }

        subTopicAnalysis[subTopicId].total++;

        const isCorrect =
          JSON.stringify(q.studentAnswer) === JSON.stringify(q.correctAnswer);

        if (isCorrect) {
          subTopicAnalysis[subTopicId].correct++;
        }
      });
    });

    const subTopicData = Object.values(subTopicAnalysis).map((data) => ({
      subTopic: data.subTopicName,
      correct: data.correct,
      total: data.total,
      avgScore:
        data.total > 0
          ? Number(((data.correct / data.total) * 100).toFixed(1))
          : 0,
    }));

    /* =======================
       E. BEST & WORST SUBTOPICS
    ======================= */
    const sortedSubTopics = [...subTopicData].sort(
      (a, b) => b.avgScore - a.avgScore
    );

    const bestSubTopic = sortedSubTopics[0] || {
      subTopic: "N/A",
      avgScore: 0,
    };

    const worstSubTopic = sortedSubTopics[sortedSubTopics.length - 1] || {
      subTopic: "N/A",
      avgScore: 0,
    };

    /* =======================
       F. KEY INSIGHTS
    ======================= */
    const keyInsights = {
      bestPerformingSubTopic: {
        name: bestSubTopic.subTopic,
        score: bestSubTopic.avgScore,
      },
      poorlyPerformingSubTopic: {
        name: worstSubTopic.subTopic,
        score: worstSubTopic.avgScore,
      },
    };

    /* =======================
       FINAL RESPONSE
    ======================= */
    res.status(200).json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          examCode: exam.examCode,
          subject: {
            _id: exam.subject._id,
            name: exam.subject.name,
          },
          subTopic: examSubTopic
            ? { _id: examSubTopic._id, name: examSubTopic.name }
            : null,
          level: exam.level,
          passPercentage: exam.passPercentage,
        },
        summary: {
          totalStudents: totalSubmission,
          highestMark,
          lowestMark,
          averageMark: Number(averageMark.toFixed(2)),
        },
        performanceDistribution,
        topPerformers,
        subTopicAnalysis: subTopicData,
        mostMistakenTopic: worstSubTopic,
        keyInsights,
      },
    });
  } catch (error) {
    console.error("Error fetching exam detailed analysis:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching exam detailed analysis",
      error: error.message,
    });
  }
};

// Get all students overview
const getAllStudentsOverview = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("username email registerNumber")
      .sort({ username: 1 })
      .lean();

    const studentOverviews = await Promise.all(
      students.map(async (student) => {
        const submissions = await ExamSubmission.find({ userId: student._id })
          .populate("examId", "examCode subject")
          .lean();

        const totalExams = submissions.length;

        const totalPercentageArray =
          submissions.length > 0
            ? submissions.map((exam) => {
                return (exam.obtainedMark / exam.examData.length) * 100;
              })
            : [];

        const avgPercentage =
          totalPercentageArray.length > 0
            ? totalPercentageArray.reduce(
                (sum, percentage) => sum + percentage,
                0
              ) / totalPercentageArray.length
            : 0;

        const passedExams = submissions.filter((s) => s.pass).length;
        const passRate = totalExams > 0 ? (passedExams / totalExams) * 100 : 0;

        // Calculate total correct/attempted
        let totalCorrect = 0;
        let totalAttempted = 0;

        submissions.forEach((sub) => {
          sub.examData.forEach((q) => {
            if (q.studentAnswer !== null && q.studentAnswer !== undefined) {
              totalAttempted++;
              const isCorrect =
                JSON.stringify(q.studentAnswer) ===
                JSON.stringify(q.correctAnswer);
              if (isCorrect) totalCorrect++;
            }
          });
        });

        return {
          _id: student._id,
          name: student.username,
          email: student.email,
          registerNumber: student.registerNumber,
          totalExams,
          avgPercentage: parseFloat(avgPercentage.toFixed(2)),
          passRate: parseFloat(passRate.toFixed(2)),
          totalCorrect,
          totalAttempted,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        students: studentOverviews,
        totalStudents: studentOverviews.length,
      },
    });
  } catch (error) {
    console.error("Error fetching students overview:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching students overview",
      error: error.message,
    });
  }
};

// Get detailed student analysis
const getStudentDetailedAnalysis = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId)
      .select("username email registerNumber role")
      .lean();

    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const submissions = await ExamSubmission.find({ userId: studentId })
      .populate({
        path: "examId",
        populate: {
          path: "subject",
          select: "name subtopics",
        },
      })
      .populate("examData.questionId", "topic subTopic questionType")
      .lean();

    // A. Basic Details
    const basicDetails = {
      studentName: student.username,
      email: student.email,
      registerNumber: student.registerNumber,
      course: "Not specified", // Add course field to User model if needed
    };

    const totalPercentageArray =
      submissions.length > 0
        ? submissions.map((exam) => {
            return (exam.obtainedMark / exam.examData.length) * 100;
          })
        : [];

    const avgPercentage =
      totalPercentageArray.length > 0
        ? totalPercentageArray.reduce(
            (sum, percentage) => sum + percentage,
            0
          ) / totalPercentageArray.length
        : 0;

    // Calculate rank (you may want to implement a more sophisticated ranking system)
    const allStudents = await User.find({ role: "student" })
      .select("_id")
      .lean();
    const allStudentScores = await Promise.all(
      allStudents.map(async (s) => {
        const subs = await ExamSubmission.find({ userId: s._id }).lean();
        const total = subs.reduce((sum, sub) => sum + sub.obtainedMark, 0);
        const avg = subs.length > 0 ? total / subs.length : 0;
        return { studentId: s._id.toString(), avgScore: avg };
      })
    );

    const sortedStudents = allStudentScores.sort(
      (a, b) => b.avgScore - a.avgScore
    );
    const rank = sortedStudents.findIndex((s) => s.studentId === studentId) + 1;

    // Calculate accuracy
    let totalCorrect = 0;
    let totalAttempted = 0;

    submissions.forEach((sub) => {
      sub.examData.forEach((q) => {
        if (q.studentAnswer !== null && q.studentAnswer !== undefined) {
          totalAttempted++;
          const isCorrect =
            JSON.stringify(q.studentAnswer) === JSON.stringify(q.correctAnswer);
          if (isCorrect) totalCorrect++;
        }
      });
    });

    const overallPerformance = {
      percentage: parseFloat(avgPercentage.toFixed(2)),
      rank,
      totalStudents: allStudents.length,
      correctAnswers: totalCorrect,
      attemptedQuestions: totalAttempted,
    };

    const subjectPerformance = {};

    submissions.forEach((sub) => {
      if (!sub.examId || !sub.examId.subject) return;

      const subjectName = sub.examId.subject.name;

      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = {
          subjectName,
          totalMarks: 0,
          examsCount: 0,
          correct: 0,
          total: 0,
        };
      }

      subjectPerformance[subjectName].totalMarks += sub.obtainedMark;
      subjectPerformance[subjectName].examsCount += 1;

      sub.examData.forEach((q) => {
        if (q.questionId) {
          subjectPerformance[subjectName].total++;
          const isCorrect =
            JSON.stringify(q.studentAnswer) === JSON.stringify(q.correctAnswer);
          if (isCorrect) subjectPerformance[subjectName].correct++;
        }
      });
    });

    // C. Exam-wise Summary (NEW)
    const markData = await markModel.findById("mark-based-on-levels");
    if (!markData) {
      throw new Error("Mark configuration not found");
    }

    const getPositiveMarkForLevelSync = (level, markData) => {
      switch (level) {
        case 1:
          return markData.level1Mark;
        case 2:
          return markData.level2Mark;
        case 3:
          return markData.level3Mark;
        case 4:
          return markData.level4Mark;
        default:
          return 0;
      }
    };

    const examSummary = submissions.map((sub) => {
      let correct = 0;
      let wrong = 0;
      let partial = 0;
      let skipped = 0;

      sub.examData.forEach((q) => {
        if (q.isRight === "Correct") correct++;
        else if (q.isRight === "Incorrect") wrong++;
        else if (q.isRight === "Partially Correct") partial++;
        else skipped++;
      });

      let subTopicName = "N/A";

      if (sub.examId?.subject?.subtopics?.length && sub.examId?.subTopic) {
        const match = sub.examId.subject.subtopics.find(
          (st) => st._id.toString() === sub.examId.subTopic.toString()
        );
        if (match) subTopicName = match.name;
      }

      const positiveMark = getPositiveMarkForLevelSync(
        sub.examId.level,
        markData
      );

      const totalMarks = sub.examData.length * positiveMark;

      const percentage =
        totalMarks > 0
          ? Number(((sub.obtainedMark / totalMarks) * 100).toFixed(2))
          : 0;

      return {
        examId: sub.examId?._id,
        subject: sub.examId?.subject?.name || "N/A",
        subTopic: subTopicName || "N/A",
        level: sub.examId?.level || "N/A",
        totalQuestions: sub.examData.length,
        correct,
        wrong,
        partial,
        skipped,
        percentage,
      };
    });

    const groupedBySubject = {};

    examSummary.forEach((exam) => {
      if (!groupedBySubject[exam.subject]) {
        groupedBySubject[exam.subject] = [];
      }
      groupedBySubject[exam.subject].push(exam);
    });

    const subjectChart = {};

    examSummary.forEach((exam) => {
      if (!subjectChart[exam.subject]) {
        subjectChart[exam.subject] = { total: 0, count: 0 };
      }
      subjectChart[exam.subject].total += exam.percentage;
      subjectChart[exam.subject].count++;
    });

    const subjectChartData = Object.entries(subjectChart).map(
      ([subject, val]) => ({
        subject,
        percentage: val.total / val.count,
      })
    );

    // D. Attempt Summary
    let correctCount = 0;
    let inCorrectCount = 0;
    let skippedCount = 0;
    let partialMarkCount = 0;

    submissions.forEach((sub) => {
      sub.examData.forEach((q) => {
        if (q.isRight === "Correct") {
          correctCount++;
        } else if (q.isRight === "Incorrect") {
          inCorrectCount++;
        } else if (q.isRight === "Partially Correct") {
          partialMarkCount++;
        } else {
          skippedCount++;
        }
      });
    });

    const attemptSummary = {
      correct: correctCount,
      wrong: inCorrectCount,
      skipped: skippedCount,
      partialCorrect: partialMarkCount,
      total: correctCount + inCorrectCount + skippedCount + partialMarkCount,
      correctPercentage: parseFloat(
        (
          (correctCount /
            (correctCount + inCorrectCount + skippedCount + partialMarkCount)) *
          100
        ).toFixed(1)
      ),
      wrongPercentage: parseFloat(
        (
          (inCorrectCount /
            (correctCount + inCorrectCount + skippedCount + partialMarkCount)) *
          100
        ).toFixed(1)
      ),
      skippedPercentage: parseFloat(
        (
          (skippedCount /
            (correctCount + inCorrectCount + skippedCount + partialMarkCount)) *
          100
        ).toFixed(1)
      ),
      partialPercentage: parseFloat(
        (
          (partialMarkCount /
            (correctCount + inCorrectCount + skippedCount + partialMarkCount)) *
          100
        ).toFixed(1)
      ),
    };

    // E. Key Insights
    const sortedSubjects = [...subjectChartData].sort(
      (a, b) => b.percentage - a.percentage
    );

    const strongestSubject = sortedSubjects[0] || {
      subject: "N/A",
      percentage: 0,
    };

    const weakestSubject = sortedSubjects[sortedSubjects.length - 1] || {
      subject: "N/A",
      percentage: 0,
    };

    const keyInsights = {
      strongestSubject: {
        name: strongestSubject.subject,
        percentage: strongestSubject.percentage,
      },
      weakestSubject: {
        name: weakestSubject.subject,
        percentage: weakestSubject.percentage,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        examGroupedBySubject: groupedBySubject,
        basicDetails,
        overallPerformance,
        subjectChartData,
        attemptSummary,
        keyInsights,
      },
    });
  } catch (error) {
    console.error("Error fetching student detailed analysis:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student detailed analysis",
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
  getAllExamsOverview,
  getExamDetailedAnalysis,
  getAllStudentsOverview,
  getStudentDetailedAnalysis,
};
