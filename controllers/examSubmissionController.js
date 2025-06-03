const { default: mongoose } = require("mongoose");
const examModel = require("../models/examModel");
const examSubmissionSchema = require("../models/examSubmissionSchema");
const userModel = require("../models/userModel");
const userPassSchema = require("../models/userPassSchema");
const sendMail = require("../utils/sendMail");
const markModel = require("../models/markModel");
const { ensureMarkConfigExists } = require("./markController");

const getAllPassedSubmission = async (req, res) => {
  try {
    const passedData = await examSubmissionSchema
      .find({
        pass: true,
      })
      .populate({
        path: "examId",
        select: "subject subTopic level examCode passPercentage",
        populate: {
          path: "subject",
          select: "name",
        },
      })
      .populate("userId");

    for (let submission of passedData) {
      if (
        submission.examId &&
        submission.examId.subject &&
        submission.examId.subTopic
      ) {
        const subject = await mongoose
          .model("Subject")
          .findById(submission.examId.subject._id);

        const subtopic = subject.subtopics.id(submission.examId.subTopic);

        if (subtopic) {
          submission.examId._doc.subTopicName = subtopic.name;
        }
      }
    }

    res.status(200).json(passedData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to get the data",
      error: error.message,
    });
  }
};

const getPassedSubmissionForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const passedData = await examSubmissionSchema
      .find({
        userId: userId,
        pass: true,
      })
      .populate({
        path: "examId",
        select: "subject subTopic level examCode passPercentage",
        populate: {
          path: "subject",
          select: "name",
        },
      });

    for (let submission of passedData) {
      if (
        submission.examId &&
        submission.examId.subject &&
        submission.examId.subTopic
      ) {
        const subject = await mongoose
          .model("Subject")
          .findById(submission.examId.subject._id);

        const subtopic = subject.subtopics.id(submission.examId.subTopic);

        if (subtopic) {
          submission.examId._doc.subTopicName = subtopic.name;
        }
      }
    }

    res.status(200).json(passedData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to get the data",
      error: error.message,
    });
  }
};

const getAllPreviousAttempt = async (req, res) => {
  try {
    const previousAttemptData = await examSubmissionSchema
      .find({
        pass: false,
      })
      .populate({
        path: "examId",
        select: "subject subTopic level examCode passPercentage",
        populate: {
          path: "subject",
          select: "name",
        },
      })
      .populate("userId")
      .sort({ createdAt: -1 });

    for (let submission of previousAttemptData) {
      if (
        submission.examId &&
        submission.examId.subject &&
        submission.examId.subTopic
      ) {
        const subject = await mongoose
          .model("Subject")
          .findById(submission.examId.subject._id);

        const subtopic = subject.subtopics.id(submission.examId.subTopic);

        if (subtopic) {
          submission.examId._doc.subTopicName = subtopic.name;
        }
      }
    }

    res.status(200).json(previousAttemptData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to get the data",
      error: error.message,
    });
  }
};

const getPreviousAttemptForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const previousAttemptData = await examSubmissionSchema
      .find({
        userId: userId,
        pass: false,
      })
      .populate({
        path: "examId",
        select: "subject subTopic level examCode passPercentage",
        populate: {
          path: "subject",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    for (let submission of previousAttemptData) {
      if (
        submission.examId &&
        submission.examId.subject &&
        submission.examId.subTopic
      ) {
        const subject = await mongoose
          .model("Subject")
          .findById(submission.examId.subject._id);

        const subtopic = subject.subtopics.id(submission.examId.subTopic);

        if (subtopic) {
          submission.examId._doc.subTopicName = subtopic.name;
        }
      }
    }

    res.status(200).json(previousAttemptData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to get the data",
      error: error.message,
    });
  }
};

const getExamSubmissionById = async (req, res) => {
  try {
    const examSubmissionId = req.params.examSubmissionId;

    if (
      !examSubmissionId ||
      !mongoose.Types.ObjectId.isValid(examSubmissionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam submission ID",
      });
    }

    const examSubmissionData = await examSubmissionSchema
      .findById(examSubmissionId)
      .populate({
        path: "examId",
        select: "subject subTopic level examCode passPercentage",
        populate: {
          path: "subject",
          select: "name",
        },
      })
      .populate({
        path: "examData",
        select: "questionType questionText options",
        populate: {
          path: "questionId",
        },
      })
      .populate({
        path: "reviews",
        populate: {
          path: "evaluator",
          select: "username email",
        },
      })
      .populate({
        path: "userId",
        select: "email username role",
      });

    if (!examSubmissionData) {
      return res.status(404).json({
        success: false,
        message: "Exam submission not found",
      });
    }

    if (
      examSubmissionData.examId &&
      examSubmissionData.examId.subject &&
      examSubmissionData.examId.subTopic
    ) {
      const subject = await mongoose
        .model("Subject")
        .findById(examSubmissionData.examId.subject._id);

      if (subject && subject.subtopics) {
        const subtopic = subject.subtopics.id(
          examSubmissionData.examId.subTopic
        );

        if (subtopic) {
          // Create _doc property if it doesn't exist
          if (!examSubmissionData.examId._doc) {
            examSubmissionData.examId._doc = {};
          }
          examSubmissionData.examId._doc.subTopicName = subtopic.name;
        }
      }
    }

    return res.status(200).json(examSubmissionData);
  } catch (error) {
    console.error("Error getting exam submission:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to get the data",
      error: error.message,
    });
  }
};

const submitExam = async (req, res) => {
  try {
    const { submissionData } = req.body;
    let studentObtainedMarks = 0;

    if (!submissionData || !submissionData.userId || !submissionData.examId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid submission data" });
    }

    const previousAttemptNumber = await examSubmissionSchema.countDocuments({
      userId: submissionData.userId,
      examId: submissionData.examId,
    });

    // Fetch exam details along with questions
    let examDetails = await examModel
      .findById(submissionData.examId)
      .populate({
        path: "subject",
        select: "name subtopics", // Fetch subtopics along with subject name
      })
      .populate("questions");

    if (examDetails && examDetails.subject) {
      // Find the specific subtopic within the subject
      const subtopic = examDetails.subject.subtopics.find((sub) =>
        sub._id.equals(examDetails.subTopic)
      );

      // Attach subtopic name manually
      examDetails = examDetails.toObject(); // Convert Mongoose document to plain object
      examDetails.subTopic = subtopic ? subtopic._id : examDetails.subTopic;
      examDetails.subTopic.name = subtopic ? subtopic.name : null;
    }

    if (!examDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });
    }

    const mark = await markModel.findById("mark-based-on-levels");
    if (!mark) {
      await ensureMarkConfigExists();
    }

    let positiveMark = mark.level1Mark,
      negativeMark = mark.level1NegativeMark;

    if (examDetails.level === 2) {
      (positiveMark = mark.level2Mark),
        (negativeMark = mark.level2NegativeMark);
    } else if (examDetails.level === 3) {
      (positiveMark = mark.level3Mark),
        (negativeMark = mark.level3NegativeMark);
    } else if (examDetails.level === 4) {
      (positiveMark = mark.level4Mark),
        (negativeMark = mark.level4NegativeMark);
    }

    const enhancedExamData = submissionData.examData.map((studQuestion) => {
      const question = examDetails.questions.find(
        (q) => q._id.toString() === studQuestion.questionId
      );

      if (!question) return studQuestion;

      return {
        ...studQuestion,
        correctAnswer: question.correctAnswers,
      };
    });

    submissionData.examData.forEach((studQuestion) => {
      const question = examDetails.questions.find(
        (q) => q._id.toString() === studQuestion.questionId
      );

      if (!question) return;

      const { questionType, correctAnswers } = question;
      const studentAnswer = studQuestion.studentAnswer;

      if (questionType === "MCQ") {
        if (correctAnswers.includes(studentAnswer?.toLowerCase())) {
          studentObtainedMarks += positiveMark;
        } else {
          studentObtainedMarks -= negativeMark;
        }
      } else if (questionType === "Fill in the Blanks") {
        if (
          Array.isArray(correctAnswers) &&
          typeof studentAnswer === "string"
        ) {
          const normalizedStudentAnswer = studentAnswer.trim().toLowerCase();

          const isExactlyCorrect = correctAnswers.some(
            (ans) =>
              typeof ans === "string" &&
              ans.trim().toLowerCase() === normalizedStudentAnswer
          );

          if (isExactlyCorrect) {
            studentObtainedMarks += positiveMark;
          }
        }
      } else if (questionType === "MSQ") {
        const correctSet = new Set(correctAnswers);
        const studentSet = new Set(studentAnswer);

        const allCorrectSelected = [...studentSet].every((ans) =>
          correctSet.has(ans)
        );
        const noExtraSelected = studentSet.size === correctSet.size;

        if (allCorrectSelected && noExtraSelected) {
          studentObtainedMarks += positiveMark;
        } else {
          studentObtainedMarks += 0;
        }
      } else if (questionType === "Short Answer") {
        let keywordMatches = correctAnswers.filter((word) =>
          studentAnswer?.toLowerCase().includes(word?.toLowerCase())
        ).length;

        if (keywordMatches > 0) {
          studentObtainedMarks +=
            (keywordMatches / correctAnswers.length) * positiveMark;
        }
      }
    });

    const passMark =
      (examDetails.passPercentage / 100) * examDetails.questions.length;

    // Store exam submission in the database
    const submittedData = await examSubmissionSchema.create({
      userId: submissionData.userId,
      examId: submissionData.examId,
      attemptNumber: previousAttemptNumber + 1,
      obtainedMark: studentObtainedMarks.toFixed(2),
      examData: enhancedExamData,
      pass: studentObtainedMarks >= passMark,
    });

    if (previousAttemptNumber >= 5 && passMark > studentObtainedMarks) {
      const evaluators = await userModel
        .find({ role: "evaluator" })
        .select("email");
      const evaluatorEmails = evaluators.map((e) => e.email);

      if (evaluatorEmails.length > 0) {
        const userDetail = await userModel.findById(submissionData.userId);

        const subject = `Student Repeated Exam Attempts: ${userDetail.username}`;
        const text = `The user ${userDetail.username} (Email: ${userDetail.email}) has attempted the exam ${previousAttemptNumber} times but has not yet passed. Exam Details: Subject - ${examDetails.subject.name}, Subtopic - ${examDetails.subTopic.name}, Level - ${examDetails.level}.`;
        const html = `
          <h2>Exam Attempt Alert</h2>
          <p>The student <strong>${userDetail.username}</strong> has attempted the exam <strong>${previousAttemptNumber} times</strong> but has not yet passed.</p>
          <h3>Exam Details:</h3>
          <ul>
            <li><strong>Subject:</strong> ${examDetails.subject.name}</li>
            <li><strong>Subtopic:</strong> ${examDetails.subTopic.name}</li>
            <li><strong>Level:</strong> ${examDetails.level}</li>
          </ul>
          <p>Please review the student's progress.</p>
        `;

        await sendMail(evaluatorEmails, subject, text, html);
      }
    }

    if (studentObtainedMarks >= passMark) {
      await userPassSchema.create({
        userId: submissionData.userId,
        subject: examDetails.subject,
        subTopic: examDetails.subTopic,
        level: examDetails.level,
        pass: true,
      });
    }

    res.status(200).json({
      success: true,
      message: "Exam submitted successfully",
      submittedData: submittedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to submit the exam",
    });
  }
};

const submitReviewForExamSubmission = async (req, res) => {
  try {
    const { examSubmissionId, userId, message } = req.body;

    if (!examSubmissionId || !userId || !message) {
      return res.status(500).json({
        success: false,
        message: "Need the evaluator Id, Exam Submission Id and the message",
      });
    }

    const updatedExamSubmission = await examSubmissionSchema
      .findByIdAndUpdate(
        examSubmissionId,
        { $push: { reviews: { evaluator: userId, message } } },
        { new: true }
      )
      .populate("reviews.evaluator", "username email")
      .populate({
        path: "examId",
        select: "subject subTopic level examCode passPercentage",
        populate: {
          path: "subject",
          select: "name",
        },
      })
      .populate({
        path: "userId",
        select: "email username role",
      });

    if (!updatedExamSubmission) {
      return res.status(404).json({
        success: false,
        message: "Exam Submission not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Added the Comment Successfully",
      examSubmission: updatedExamSubmission,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to add comment for the exam",
    });
  }
};

const updateCommentInExamSubmission = async (req, res) => {
  try {
    const { examId, reviewId } = req.params;
    const { message } = req.body;

    if (!examId || !reviewId || !message) {
      return res.status(400).json({
        success: false,
        message: "The Exam, Review Id and Message is needed",
      });
    }

    const updatedComment = await examSubmissionSchema
      .findOneAndUpdate(
        { _id: examId, "reviews._id": reviewId },
        { $set: { "reviews.$.message": message } },
        { new: true }
      )
      .populate("reviews.evaluator", "username email")
      .populate({
        path: "examId",
        select: "subject subTopic level examCode passPercentage",
        populate: {
          path: "subject",
          select: "name",
        },
      })
      .populate({
        path: "userId",
        select: "email username role",
      });

    if (!updatedComment) {
      return res.status(404).json({
        success: false,
        message: "Exam Submission not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Updated the Comment Successfully",
      examSubmission: updatedComment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to update the Comment",
    });
  }
};

const deleteCommentInExamSubmission = async (req, res) => {
  try {
    const { examId, reviewId } = req.params;

    if (!examId || !reviewId) {
      return res.status(500).json({
        success: false,
        message: "The Exam and Review Id is needed",
      });
    }

    const deletedComment = await examSubmissionSchema
      .findByIdAndUpdate(
        examId,
        { $pull: { reviews: { _id: reviewId } } },
        { new: true }
      )
      .populate("reviews.evaluator", "username email")
      .populate({
        path: "examId",
        select: "subject subTopic level examCode passPercentage",
        populate: {
          path: "subject",
          select: "name",
        },
      })
      .populate({
        path: "userId",
        select: "email username role",
      });

    if (!deletedComment) {
      return res.status(404).json({
        success: false,
        message: "Exam Submission not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Deleted the Comment Successfully",
      examSubmission: deletedComment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete the Comment",
    });
  }
};

module.exports = {
  getAllPassedSubmission,
  getPassedSubmissionForUser,
  getAllPreviousAttempt,
  getPreviousAttemptForUser,
  getExamSubmissionById,
  submitExam,
  submitReviewForExamSubmission,
  updateCommentInExamSubmission,
  deleteCommentInExamSubmission,
};
