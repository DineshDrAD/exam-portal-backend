const examModel = require("../models/examModel");
const questionModel = require("../models/questionModel");
const Subject = require("../models/subjectModel");

const generateUniqueExamCode = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let examCode;
  let exists = true;

  while (exists) {
    examCode = "";
    for (let i = 0; i < 6; i++) {
      examCode += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    const existingExam = await examModel.findOne({ examCode });
    if (!existingExam) {
      exists = false;
    }
  }

  return examCode;
};

// const createExam = async (req, res) => {
//   try {
//     const { subject, subTopic, level, status, questions, passPercentage } =
//       req.body;

//     if (
//       !subject ||
//       !subTopic ||
//       !level ||
//       !status ||
//       !questions ||
//       !passPercentage
//     ) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const existingExam = await examModel.findOne({ subject, subTopic, level });
//     if (existingExam) {
//       return res.status(409).json({
//         error: "Exam with this subject, subTopic, and level already exists",
//       });
//     }

//     const examCode = await generateUniqueExamCode();

//     const createdQuestions = await questionModel.create(
//       questions.map((question) => ({
//         subject,
//         subTopic,
//         level,
//         questionType: question.questionType,
//         questionText: question.questionText,
//         options: question.options,
//         correctAnswers: question.correctAnswers,
//         image: question.image,
//       }))
//     );

//     const exam = await examModel.create({
//       subject,
//       subTopic,
//       level,
//       status,
//       passPercentage: passPercentage || 90,
//       examCode,
//       questions: createdQuestions.map((q) => q._id),
//     });

//     res.status(201).json({
//       success: true,
//       message: "Exam created successfully",
//       data: exam,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to create exam",
//       error: error.message,
//     });
//   }
// };

const createExam = async (req, res) => {
  try {
    const {
      subject,
      subTopic,
      level,
      status,
      questions,
      passPercentage,
      questionSelection,
    } = req.body;

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

    const existingExam = await examModel.findOne({ subject, subTopic, level });
    if (existingExam) {
      return res.status(409).json({
        error: "Exam with this subject, subTopic, and level already exists",
      });
    }

    const examCode = await generateUniqueExamCode();

    const createdQuestions = await questionModel.create(
      questions.map((question) => ({
        subject,
        subTopic,
        level,
        questionType: question.questionType,
        questionText: question.questionText,
        options: question.options,
        correctAnswers: question.correctAnswers,
        image: question.image,
      }))
    );

    const exam = await examModel.create({
      subject,
      subTopic,
      level,
      status,
      passPercentage: passPercentage || 90,
      examCode,
      questions: createdQuestions.map((q) => q._id),
      questionSelection: questionSelection || {
        MCQ: { startIndex: 0, count: 0 },
        MSQ: { startIndex: 0, count: 0 },
        "Fill in the Blanks": { startIndex: 0, count: 0 },
        "Short Answer": { startIndex: 0, count: 0 },
      },
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
    const exams = await examModel.find().populate("subject questions");

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
          shuffleQuestion: exam.shuffleQuestion,
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
          shuffleQuestion: exam.shuffleQuestion,
        };
      })
    );

    res.status(200).json(examsWithoutCorrectAnswers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// const updateExam = async (req, res) => {
//   try {
//     const examId = req.params.id;
//     const { subject, subTopic, level, status, questions, passPercentage } =
//       req.body;

//     if (
//       !subject ||
//       !subTopic ||
//       !level ||
//       !status ||
//       !questions ||
//       !passPercentage
//     ) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     let exam = await examModel.findById(examId);

//     if (!exam) {
//       return res.status(404).json({
//         success: false,
//         message: "Exam not found with the provided ID",
//       });
//     }

//     const updatedQuestions = [];

//     for (const question of questions) {
//       const existingQuestion = await questionModel.findOne({
//         questionText: question.questionText,
//         level,
//         subject,
//         subTopic,
//       });

//       if (existingQuestion) {
//         existingQuestion.questionType = question.questionType;
//         existingQuestion.options = question.options || existingQuestion.options;
//         existingQuestion.correctAnswers = question.correctAnswers;
//         existingQuestion.image = question.image || existingQuestion.image;

//         const updatedQuestion = await existingQuestion.save();
//         updatedQuestions.push(updatedQuestion._id);
//       } else {
//         const newQuestion = await questionModel.create({
//           subject,
//           subTopic,
//           level,
//           questionType: question.questionType,
//           questionText: question.questionText,
//           options: question.options,
//           correctAnswers: question.correctAnswers,
//           image: question.image,
//         });
//         updatedQuestions.push(newQuestion._id);
//       }
//     }

//     exam.passPercentage = passPercentage || exam.passPercentage || 90;
//     exam.questions = updatedQuestions;

//     await exam.save();

//     res.status(200).json({
//       success: true,
//       message: "Exam and questions updated successfully",
//       data: exam,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to update exam",
//       error: error.message,
//     });
//   }
// };

const updateExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const {
      subject,
      subTopic,
      level,
      status,
      questions,
      passPercentage,
      questionSelection,
    } = req.body;

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

    let exam = await examModel.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found with the provided ID",
      });
    }

    const updatedQuestions = [];

    for (const question of questions) {
      const existingQuestion = await questionModel.findOne({
        questionText: question.questionText,
        level,
        subject,
        subTopic,
      });

      if (existingQuestion) {
        existingQuestion.questionType = question.questionType;
        existingQuestion.options = question.options || existingQuestion.options;
        existingQuestion.correctAnswers = question.correctAnswers;
        existingQuestion.image = question.image || existingQuestion.image;

        const updatedQuestion = await existingQuestion.save();
        updatedQuestions.push(updatedQuestion._id);
      } else {
        const newQuestion = await questionModel.create({
          subject,
          subTopic,
          level,
          questionType: question.questionType,
          questionText: question.questionText,
          options: question.options,
          correctAnswers: question.correctAnswers,
          image: question.image,
        });
        updatedQuestions.push(newQuestion._id);
      }
    }

    exam.passPercentage = passPercentage || exam.passPercentage || 90;
    exam.questions = updatedQuestions;
    exam.questionSelection = questionSelection ||
      exam.questionSelection || {
        MCQ: { startIndex: 0, count: 0 },
        MSQ: { startIndex: 0, count: 0 },
        "Fill in the Blanks": { startIndex: 0, count: 0 },
        "Short Answer": { startIndex: 0, count: 0 },
      };

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

    const exam = await examModel.findOne({ examCode }).populate({
      path: "questions",
      select: "-correctAnswers",
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

const updateShuffleQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await examModel.findById(id);
    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });
    }
    await examModel.findByIdAndUpdate(id, {
      shuffleQuestion: !exam.shuffleQuestion,
    });

    res.status(200).json({
      success: true,
      message: "Questions shuffle updated successfully",
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update the question shuffle",
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
        subTopicId: subTopic?._id || null,
        level: exam.level,
        status: exam.status,
        questions: exam.questions,
        examCode: exam.examCode,
        passPercentage: exam.passPercentage,
        shuffleQuestion: exam.shuffleQuestion,
      };
    };

    const processedExam = await examWithNames();

    res.status(200).json(processedExam);
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

    const exam = await examModel.findById(id);
    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });
    }

    await questionModel.deleteMany({ _id: { $in: exam.questions } });

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
  updateShuffleQuestion,
  getExamById,
  deleteExam,
};
