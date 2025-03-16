const examModel = require("../models/examModel");
const Subject = require("../models/subjectModel");
const userPassSchema = require("../models/userPassSchema");

const getEligibleExamForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userProgress = await userPassSchema
      .find({ userId, pass: true })
      .select("subject subTopic level");

    let eligibleExams = new Map();

    for (let progress of userProgress) {
      const nextLevel = progress.level + 1;
      if (nextLevel <= 4) {
        eligibleExams.set(`${progress.subject}-${progress.subTopic}`, {
          subjectId: progress.subject,
          subTopicId: progress.subTopic,
          level: nextLevel,
        });
      }
    }

    const allSubjects = await Subject.find().select("_id name subtopics");

    for (let subject of allSubjects) {
      for (let subTopic of subject.subtopics) {
        const key = `${subject._id}-${subTopic._id}`;
        if (!eligibleExams.has(key)) {
          eligibleExams.set(key, {
            subjectId: subject._id,
            subTopicId: subTopic._id,
            level: 1,
          });
        }
      }
    }

    const eligibleExamList = await Promise.all(
      Array.from(eligibleExams.values()).map(async (item) => {
        return examModel.find({
          subject: item.subjectId,
          subTopic: item.subTopicId,
          level: item.level,
          status: "active",
        });
      })
    );

    let flattenedExams = eligibleExamList.flat();

    flattenedExams = flattenedExams.map((exam) => {
      const subject = allSubjects.find((sub) => sub._id.equals(exam.subject));
      let subTopicName = "";
      if (subject) {
        const subTopic = subject.subtopics.find((st) =>
          st._id.equals(exam.subTopic)
        );
        if (subTopic) subTopicName = subTopic.name;
      }
      return {
        _id: exam._id,
        subjectId: exam.subject,
        subjectName: subject ? subject.name : null,
        subTopicId: exam.subTopic,
        subTopicName: subTopicName || null,
        questions: exam.questions,
        level: exam.level,
        status: exam.status,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
        __v: exam.__v,
        examCode: exam.examCode,
        passPercentage: exam.passPercentage,
      };
    });

    res.status(200).json(flattenedExams);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get eligible exams for the user",
      error: error.message,
    });
  }
};

module.exports = { getEligibleExamForUser };
