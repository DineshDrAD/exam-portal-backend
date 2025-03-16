const examModel = require("../models/examModel");
const questionModel = require("../models/questionModel");
const Subject = require("../models/subjectModel");

const generateUniqueExamCode = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let examCode;
  let exists = true;

  // Generate a new unique code
  while (exists) {
    examCode = "";
    for (let i = 0; i < 6; i++) {
      examCode += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    // Check if the generated code already exists
    const existingExam = await examModel.findOne({ examCode });
    if (!existingExam) {
      exists = false;
    }
  }

  return examCode;
};

const createExam = async (req, res) => {
  try {
    const { subject, subTopic, level, status, questions, passPercentage } =
      req.body;

    if (
      !subject ||
      !subTopic ||
      !level ||
      !status ||
      !questions ||
      !passPercentage
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const examCode = await generateUniqueExamCode();

    // First, create all questions
    const createdQuestions = await questionModel.create(
      questions.map((question) => ({
        subject,
        subTopic,
        level,
        questionType: question.questionType,
        questionText: question.questionText,
        options: question.options,
        correctAnswers: question.correctAnswers,
      }))
    );

    // Create the exam with references to the created questions
    const exam = await examModel.create({
      subject,
      subTopic,
      level,
      status,
      passPercentage,
      examCode,
      questions: createdQuestions.map((q) => q._id),
    });

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create exam",
      error: error.message,
    });
  }
};

const getAllExams = async (req, res) => {
  try {
    const exams = await examModel.find().populate("subject questions"); // Remove "subTopic"

    // Extract only subject name and subtopic name
    const examsWithNames = await Promise.all(
      exams.map(async (exam) => {
        const subject = await Subject.findById(exam.subject);
        const subTopic = subject?.subtopics.find(
          (sub) => sub._id.toString() === exam.subTopic.toString()
        );

        return {
          _id: exam._id,
          subject: subject?.name || "Unknown Subject",
          subjectId: subject?._id,
          subTopic: subTopic?.name || "Unknown Subtopic",
          subTopicId: subTopic._id,
          level: exam.level,
          status: exam.status,
          questions: exam.questions,
          passPercentage: exam.passPercentage,
          examCode: exam.examCode,
        };
      })
    );

    res.status(200).json(examsWithNames);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllExamWithoutCorrectAnswers = async (req, res) => {
  try {
    const exams = await examModel.find().populate("subject questions");

    const examsWithoutCorrectAnswers = await Promise.all(
      exams.map(async (exam) => {
        const subject = await Subject.findById(exam.subject);
        const subTopic = subject?.subtopics.find(
          (sub) => sub._id.toString() === exam.subTopic.toString()
        );

        const questions = exam.questions.map(({ _doc }) => {
          const { correctAnswers, ...rest } = _doc;
          return rest;
        });

        return {
          _id: exam._id,
          subject: subject?.name || "Unknown Subject",
          subjectId: subject?._id,
          subTopic: subTopic?.name || "Unknown Subtopic",
          subTopicId: subTopic?._id,
          level: exam.level,
          status: exam.status,
          passPercentage: exam.passPercentage,
          questions,
          examCode: exam.examCode,
        };
      })
    );

    res.status(200).json(examsWithoutCorrectAnswers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateExam = async (req, res) => {
  try {
    const examId = req.params.id; // Get examId from params
    const { subject, subTopic, level, status, questions, passPercentage } =
      req.body;

    // Validate required fields
    if (!subject || !subTopic || !level || !status || !questions) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Find the exam by examId
    let exam = await examModel.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found with the provided ID",
      });
    }

    // Array to hold newly created or updated question IDs
    const updatedQuestions = [];

    for (const question of questions) {
      const existingQuestion = await questionModel.findOne({
        questionText: question.questionText,
        level,
        subject,
        subTopic,
      });

      if (existingQuestion) {
        // If the question already exists, update it
        existingQuestion.questionType = question.questionType;
        existingQuestion.options = question.options || existingQuestion.options;
        existingQuestion.correctAnswers = question.correctAnswers;

        const updatedQuestion = await existingQuestion.save();
        updatedQuestions.push(updatedQuestion._id);
      } else {
        // If the question doesn't exist, create a new one
        const newQuestion = await questionModel.create({
          subject,
          subTopic,
          level,
          questionType: question.questionType,
          questionText: question.questionText,
          options: question.options,
          correctAnswers: question.correctAnswers,
        });
        updatedQuestions.push(newQuestion._id);
      }
    }

    // Update the exam with the new/updated questions
    exam.passPercentage = passPercentage || exam.passPercentage;
    exam.questions = updatedQuestions;

    await exam.save();

    res.status(200).json({
      success: true,
      message: "Exam and questions updated successfully",
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update exam",
      error: error.message,
    });
  }
};

const getAllExamDetailsWithoutAnswer = async (req, res) => {
  try {
    const { examCode } = req.params;

    // Find the exam with the given examCode and populate questions, excluding correctAnswers
    const exam = await examModel.findOne({ examCode }).populate({
      path: "questions",
      select: "-correctAnswers", // Exclude correctAnswers field
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found with the provided exam code",
      });
    }

    res.status(200).json({
      success: true,
      exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam details",
      error: error.message,
    });
  }
};

const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await examModel.findById(id).populate("questions");

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found with the provided ID",
      });
    }

    const examWithNames = async () => {
      const subject = await Subject.findById(exam.subject);
      const subTopic = subject?.subtopics.find(
        (sub) => sub._id.toString() === exam.subTopic.toString()
      );

      return {
        _id: exam._id,
        subject: subject?.name || "Unknown Subject",
        subjectId: subject?._id,
        subTopic: subTopic?.name || "Unknown Subtopic",
        subTopicId: subTopic?._id || null, // Prevent error if subTopic is null
        level: exam.level,
        status: exam.status,
        questions: exam.questions,
        examCode: exam.examCode,
        passPercentage: exam.passPercentage,
      };
    };

    const processedExam = await examWithNames(); // ✅ Await the function

    res.status(200).json(
      processedExam // ✅ Send the resolved data, not the function itself
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam details",
      error: error.message,
    });
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the exam by ID
    const exam = await examModel.findById(id);
    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });
    }

    // Delete associated questions
    await questionModel.deleteMany({ _id: { $in: exam.questions } });

    // Delete the exam
    await examModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Exam and associated questions deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete exam",
      error: error.message,
    });
  }
};

module.exports = {
  createExam,
  getAllExams,
  getAllExamDetailsWithoutAnswer,
  getAllExamWithoutCorrectAnswers,
  updateExam,
  getExamById,
  deleteExam,
};
